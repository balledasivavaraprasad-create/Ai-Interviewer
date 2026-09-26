from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query
from app.models.schedule import CreateScheduleRequest, ScheduleStatus
from app.repositories.schedule_repository import schedule_repo
from app.repositories.job_repository import job_repo
from app.repositories.organization_repository import org_repo
from app.services.schedule_service import schedule_service
from app.routers.deps import get_current_user

router = APIRouter(prefix="/schedules", tags=["schedules"])

@router.get("")
def list_schedules(
    organizationId: Optional[str] = Query(None),
    jobRoleId: Optional[str] = Query(None)
):
    if organizationId:
        raw_schedules = schedule_repo.list_by_org(organizationId)
    elif jobRoleId:
        raw_schedules = schedule_repo.list_by_job(jobRoleId)
    else:
        # Get all
        col = schedule_repo.collection
        if col is not None:
            raw_schedules = [schedule_repo.clean_doc(d) for d in col.find({})]
        else:
            raw_schedules = list(schedule_repo._memory_store.values())

    evaluated = []
    for s in raw_schedules:
        ev = schedule_service.evaluate_status(s)
        # enrich org and job title
        org = org_repo.get_by_id(ev.get("organizationId"))
        job = job_repo.get_by_id(ev.get("jobRoleId"))
        ev["organizationName"] = org.get("name") if org else "AURA Partner"
        ev["jobTitle"] = job.get("title") if job else ev.get("jobTitle", "Technical Role")
        ev["interviewLevel"] = job.get("interviewLevel") if job else ev.get("interviewLevel", "INTERMEDIATE")
        evaluated.append(ev)

    return {"schedules": evaluated}

@router.get("/{schedule_id}")
def get_schedule(schedule_id: str):
    schedule = schedule_repo.get_by_id(schedule_id)
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule window not found")

    ev = schedule_service.evaluate_status(schedule)
    org = org_repo.get_by_id(ev.get("organizationId"))
    job = job_repo.get_by_id(ev.get("jobRoleId"))
    ev["organizationName"] = org.get("name") if org else "AURA Partner"
    ev["jobTitle"] = job.get("title") if job else ev.get("jobTitle", "Technical Role")
    ev["interviewLevel"] = job.get("interviewLevel") if job else ev.get("interviewLevel", "INTERMEDIATE")
    return {"schedule": ev}

@router.post("")
def create_schedule(req: CreateScheduleRequest, user: dict = Depends(get_current_user)):
    org_id = user.get("organizationId") or "org_aurelia"
    job = job_repo.get_by_id(req.jobRoleId)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target job role not found")

    schedule_id = f"sch_{int(datetime.now().timestamp() * 1000)}"
    new_schedule = {
        "id": schedule_id,
        "organizationId": org_id,
        "jobRoleId": req.jobRoleId,
        "jobTitle": job.get("title"),
        "interviewLevel": job.get("interviewLevel", "INTERMEDIATE"),
        "date": req.date,
        "startTime": req.startTime,
        "endTime": req.endTime,
        "timezone": req.timezone,
        "duration": req.duration,
        "capacity": req.capacity,
        "bookedCount": 0,
        "status": ScheduleStatus.UPCOMING.value,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    created = schedule_repo.create(new_schedule)
    ev = schedule_service.evaluate_status(created)
    return {"success": True, "schedule": ev}

@router.patch("/{schedule_id}/cancel")
def cancel_schedule(schedule_id: str, user: dict = Depends(get_current_user)):
    updated = schedule_repo.update(schedule_id, {"status": ScheduleStatus.CANCELLED.value})
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    return {"success": True, "schedule": updated}
