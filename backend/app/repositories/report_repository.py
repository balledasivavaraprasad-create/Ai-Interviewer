from typing import List, Optional, Dict, Any
from app.repositories.base import BaseRepository

class ReportRepository(BaseRepository):
    def __init__(self):
        super().__init__("reports")
        self._recruiter_reports: Dict[str, Dict[str, Any]] = {}
        self._candidate_reports: Dict[str, Dict[str, Any]] = {}

    def save_candidate_report(self, report: Dict[str, Any]) -> Dict[str, Any]:
        r_id = report["id"]
        report["type"] = "CANDIDATE"
        col = self.collection
        if col is not None:
            col.update_one({"id": r_id}, {"$set": report}, upsert=True)
        self._candidate_reports[r_id] = report
        return report

    def save_recruiter_report(self, report: Dict[str, Any]) -> Dict[str, Any]:
        r_id = report["id"]
        report["type"] = "RECRUITER"
        col = self.collection
        if col is not None:
            col.update_one({"id": r_id}, {"$set": report}, upsert=True)
        self._recruiter_reports[r_id] = report
        return report

    def get_candidate_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            doc = col.find_one({"id": report_id, "type": "CANDIDATE"})
            if doc:
                return self.clean_doc(doc)
        return self._candidate_reports.get(report_id)

    def get_candidate_report_by_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            doc = col.find_one({"sessionId": session_id, "type": "CANDIDATE"})
            if doc:
                return self.clean_doc(doc)
        for r in self._candidate_reports.values():
            if r.get("sessionId") == session_id:
                return r
        return None

    def get_recruiter_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            doc = col.find_one({"id": report_id, "type": "RECRUITER"})
            if doc:
                return self.clean_doc(doc)
        return self._recruiter_reports.get(report_id)

    def get_recruiter_report_by_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            doc = col.find_one({"sessionId": session_id, "type": "RECRUITER"})
            if doc:
                return self.clean_doc(doc)
        for r in self._recruiter_reports.values():
            if r.get("sessionId") == session_id:
                return r
        return None

    def list_candidate_reports(self, candidate_email: str) -> List[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            docs = list(col.find({"type": "CANDIDATE"}).sort("createdAt", -1))
            return [self.clean_doc(d) for d in docs]
        return list(self._candidate_reports.values())

    def list_recruiter_reports_by_org(self, org_name: str) -> List[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            docs = list(col.find({"type": "RECRUITER", "organizationName": org_name}).sort("reportGeneratedAt", -1))
            return [self.clean_doc(d) for d in docs]
        return [r for r in self._recruiter_reports.values() if r.get("organizationName") == org_name]

report_repo = ReportRepository()
