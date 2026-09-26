from typing import List, Optional, Dict, Any
from app.repositories.base import BaseRepository

class ScheduleRepository(BaseRepository):
    def __init__(self):
        super().__init__("schedules")

    def list_by_org(self, org_id: str) -> List[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            docs = list(col.find({"organizationId": org_id}))
            return [self.clean_doc(d) for d in docs]
        return [s for s in self._memory_store.values() if s.get("organizationId") == org_id]

    def list_by_job(self, job_id: str) -> List[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            docs = list(col.find({"jobRoleId": job_id}))
            return [self.clean_doc(d) for d in docs]
        return [s for s in self._memory_store.values() if s.get("jobRoleId") == job_id]

    def get_by_id(self, schedule_id: str) -> Optional[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            doc = col.find_one({"id": schedule_id})
            if doc:
                return self.clean_doc(doc)
        return self._memory_store.get(schedule_id)

    def create(self, schedule: Dict[str, Any]) -> Dict[str, Any]:
        s_id = schedule["id"]
        col = self.collection
        if col is not None:
            col.update_one({"id": s_id}, {"$set": schedule}, upsert=True)
        self._memory_store[s_id] = schedule
        return schedule

    def update(self, schedule_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            col.update_one({"id": schedule_id}, {"$set": updates})
            doc = col.find_one({"id": schedule_id})
            return self.clean_doc(doc)
        if schedule_id in self._memory_store:
            self._memory_store[schedule_id].update(updates)
            return self._memory_store[schedule_id]
        return None

    def increment_booked(self, schedule_id: str) -> bool:
        col = self.collection
        if col is not None:
            res = col.update_one({"id": schedule_id}, {"$inc": {"bookedCount": 1}})
            return res.modified_count > 0
        if schedule_id in self._memory_store:
            self._memory_store[schedule_id]["bookedCount"] = self._memory_store[schedule_id].get("bookedCount", 0) + 1
            return True
        return False

schedule_repo = ScheduleRepository()
