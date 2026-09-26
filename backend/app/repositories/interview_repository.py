from typing import List, Optional, Dict, Any
from app.repositories.base import BaseRepository

class InterviewRepository(BaseRepository):
    def __init__(self):
        super().__init__("interview_sessions")

    def get_by_id(self, session_id: str) -> Optional[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            doc = col.find_one({"id": session_id})
            if doc:
                return self.clean_doc(doc)
        return self._memory_store.get(session_id)

    def find_active_official(self, candidate_id: str, schedule_id: str) -> Optional[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            doc = col.find_one({
                "candidateId": candidate_id,
                "scheduleId": schedule_id,
                "status": {"$in": ["SCHEDULED", "WAITING", "IN_PROGRESS"]}
            })
            if doc:
                return self.clean_doc(doc)
        for s in self._memory_store.values():
            if s.get("candidateId") == candidate_id and s.get("scheduleId") == schedule_id:
                if s.get("status") in ["SCHEDULED", "WAITING", "IN_PROGRESS"]:
                    return s
        return None

    def create(self, session: Dict[str, Any]) -> Dict[str, Any]:
        s_id = session["id"]
        col = self.collection
        if col is not None:
            col.update_one({"id": s_id}, {"$set": session}, upsert=True)
        self._memory_store[s_id] = session
        return session

    def update_session(self, session_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            col.update_one({"id": session_id}, {"$set": updates})
            doc = col.find_one({"id": session_id})
            return self.clean_doc(doc)
        if session_id in self._memory_store:
            self._memory_store[session_id].update(updates)
            return self._memory_store[session_id]
        return None

    def append_transcript(self, session_id: str, item: Dict[str, Any]):
        col = self.collection
        if col is not None:
            col.update_one({"id": session_id}, {"$push": {"transcript": item}})
        if session_id in self._memory_store:
            self._memory_store[session_id].setdefault("transcript", []).append(item)

    def append_evidence(self, session_id: str, item: Dict[str, Any]):
        col = self.collection
        if col is not None:
            col.update_one({"id": session_id}, {"$push": {"evidence": item}})
        if session_id in self._memory_store:
            self._memory_store[session_id].setdefault("evidence", []).append(item)

    def append_integrity_event(self, session_id: str, event: Dict[str, Any]):
        col = self.collection
        if col is not None:
            col.update_one({"id": session_id}, {"$push": {"integrityEvents": event}})
        if session_id in self._memory_store:
            self._memory_store[session_id].setdefault("integrityEvents", []).append(event)

    def list_by_candidate(self, candidate_id: str) -> List[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            docs = list(col.find({"candidateId": candidate_id}).sort("createdAt", -1))
            return [self.clean_doc(d) for d in docs]
        results = [s for s in self._memory_store.values() if s.get("candidateId") == candidate_id]
        return sorted(results, key=lambda x: x.get("createdAt", ""), reverse=True)

    def list_by_org(self, org_id: str) -> List[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            docs = list(col.find({"organizationId": org_id}).sort("createdAt", -1))
            return [self.clean_doc(d) for d in docs]
        results = [s for s in self._memory_store.values() if s.get("organizationId") == org_id]
        return sorted(results, key=lambda x: x.get("createdAt", ""), reverse=True)

interview_repo = InterviewRepository()
