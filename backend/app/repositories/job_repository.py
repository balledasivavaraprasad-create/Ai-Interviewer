from typing import List, Optional, Dict, Any
from app.repositories.base import BaseRepository

class JobRepository(BaseRepository):
    def __init__(self):
        super().__init__("job_roles")

    def list_all(self) -> List[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            docs = list(col.find({"status": "ACTIVE"}))
            return [self.clean_doc(d) for d in docs]
        return list(self._memory_store.values())

    def list_by_org(self, org_id: str) -> List[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            docs = list(col.find({"organizationId": org_id, "status": "ACTIVE"}))
            return [self.clean_doc(d) for d in docs]
        return [j for j in self._memory_store.values() if j.get("organizationId") == org_id]

    def get_by_id(self, job_id: str) -> Optional[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            doc = col.find_one({"id": job_id})
            if doc:
                return self.clean_doc(doc)
        return self._memory_store.get(job_id)

    def search_by_target(self, query: str) -> List[Dict[str, Any]]:
        all_jobs = self.list_all()
        if not query:
            return all_jobs
        q = query.lower().strip()
        matched = []
        for j in all_jobs:
            title = j.get("title", "").lower()
            skills = [s.lower() for s in j.get("skills", [])]
            desc = j.get("description", "").lower()
            if q in title or any(q in s for s in skills) or q in desc:
                matched.append(j)
        # If no strict match found, return all available jobs so candidate can browse
        return matched if matched else all_jobs

    def create(self, job: Dict[str, Any]) -> Dict[str, Any]:
        job_id = job["id"]
        col = self.collection
        if col is not None:
            col.update_one({"id": job_id}, {"$set": job}, upsert=True)
        self._memory_store[job_id] = job
        return job

job_repo = JobRepository()
