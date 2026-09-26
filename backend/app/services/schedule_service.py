from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Tuple, Optional
from app.repositories.schedule_repository import schedule_repo
from app.models.schedule import ScheduleStatus

class ScheduleService:
    def get_server_now(self) -> datetime:
        # Server authoritative time in UTC
        return datetime.now(timezone.utc)

    def parse_schedule_datetimes(self, schedule: Dict[str, Any]) -> Tuple[datetime, datetime]:
        """
        Parses schedule 'date' (YYYY-MM-DD), 'startTime' (HH:MM), and 'endTime' (HH:MM).
        Schedules in AURA · TALENT default to Asia/Kolkata (+05:30) or UTC as configured.
        """
        date_str = schedule.get("date")
        start_str = schedule.get("startTime")
        end_str = schedule.get("endTime")
        tz_name = schedule.get("timezone", "Asia/Kolkata")

        # Offset mapping for common timezones
        offset_hours, offset_minutes = 5, 30
        if "UTC" in tz_name:
            offset_hours, offset_minutes = 0, 0
        elif "PST" in tz_name:
            offset_hours, offset_minutes = -8, 0
        elif "EST" in tz_name:
            offset_hours, offset_minutes = -5, 0

        tz = timezone(timedelta(hours=offset_hours, minutes=offset_minutes))

        start_dt = datetime.strptime(f"{date_str} {start_str}", "%Y-%m-%d %H:%M").replace(tzinfo=tz)
        end_dt = datetime.strptime(f"{date_str} {end_str}", "%Y-%m-%d %H:%M").replace(tzinfo=tz)

        # Convert to UTC for authoritative uniform comparison
        return start_dt.astimezone(timezone.utc), end_dt.astimezone(timezone.utc)

    def evaluate_status(self, schedule: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates authoritative status and countdown for the given schedule.
        """
        manual_status = schedule.get("status")
        if manual_status in [ScheduleStatus.CANCELLED.value, ScheduleStatus.COMPLETED.value]:
            return {
                **schedule,
                "authoritativeStatus": manual_status,
                "secondsUntilOpen": 0,
                "secondsUntilClose": 0,
                "canEnter": False
            }

        start_utc, end_utc = self.parse_schedule_datetimes(schedule)
        now_utc = self.get_server_now()

        capacity = schedule.get("capacity", 10)
        booked = schedule.get("bookedCount", 0)
        is_full = booked >= capacity

        if now_utc < start_utc:
            authoritative_status = ScheduleStatus.UPCOMING.value
            seconds_until_open = int((start_utc - now_utc).total_seconds())
            seconds_until_close = int((end_utc - now_utc).total_seconds())
            can_enter = False
        elif start_utc <= now_utc <= end_utc:
            authoritative_status = ScheduleStatus.OPEN.value
            seconds_until_open = 0
            seconds_until_close = int((end_utc - now_utc).total_seconds())
            can_enter = not is_full
        else:
            authoritative_status = ScheduleStatus.EXPIRED.value
            seconds_until_open = 0
            seconds_until_close = 0
            can_enter = False

        return {
            **schedule,
            "authoritativeStatus": authoritative_status,
            "secondsUntilOpen": max(0, seconds_until_open),
            "secondsUntilClose": max(0, seconds_until_close),
            "canEnter": can_enter,
            "isFull": is_full,
            "serverTimeUtc": now_utc.isoformat()
        }

    def validate_candidate_access(self, schedule_id: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        schedule = schedule_repo.get_by_id(schedule_id)
        if not schedule:
            return False, None, "Official schedule not found."

        eval_schedule = self.evaluate_status(schedule)
        status = eval_schedule["authoritativeStatus"]

        if status == ScheduleStatus.CANCELLED.value:
            return False, eval_schedule, "This interview window has been cancelled by the organization."
        if status == ScheduleStatus.EXPIRED.value:
            return False, eval_schedule, "This official interview window has already expired."
        if status == ScheduleStatus.UPCOMING.value:
            secs = eval_schedule["secondsUntilOpen"]
            return False, eval_schedule, f"Interview window is upcoming. It will open in {secs} seconds."
        if eval_schedule["isFull"]:
            return False, eval_schedule, "Interview window is currently full to capacity."

        return True, eval_schedule, "Access granted to official interview window."

schedule_service = ScheduleService()
