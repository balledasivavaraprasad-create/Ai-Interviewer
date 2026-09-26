from fastapi import APIRouter, HTTPException, Depends, status
from app.repositories.report_repository import report_repo
from app.routers.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/candidate/{session_id}")
def get_candidate_report(session_id: str):
    rep = report_repo.get_candidate_report_by_session(session_id)
    if not rep:
        # Check by report id
        rep = report_repo.get_candidate_report(session_id)
    if not rep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate performance report not found")
    return {"report": rep}

@router.get("/recruiter/{session_id}")
def get_recruiter_report(session_id: str):
    rep = report_repo.get_recruiter_report_by_session(session_id)
    if not rep:
        # Check by report id
        rep = report_repo.get_recruiter_report(session_id)
    if not rep:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter evaluation report not found")
    return {"report": rep}

@router.get("/org/{org_name}")
def list_org_reports(org_name: str):
    reports = report_repo.list_recruiter_reports_by_org(org_name)
    return {"reports": reports}

@router.get("/candidate-history/{email}")
def list_candidate_reports(email: str):
    reports = report_repo.list_candidate_reports(email)
    return {"reports": reports}
