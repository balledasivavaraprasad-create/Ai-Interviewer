from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status, Query
from app.models.job import CreateJobRequest
from app.repositories.job_repository import job_repo
from app.repositories.organization_repository import org_repo
from app.routers.deps import get_current_user

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("")
def list_jobs(
    targetJob: Optional[str] = Query(None),
    organizationId: Optional[str] = Query(None)
):
    if organizationId:
        jobs = job_repo.list_by_org(organizationId)
    elif targetJob:
        jobs = job_repo.search_by_target(targetJob)
    else:
        jobs = job_repo.list_all()

    # Enrich with organization name
    enriched = []
    for j in jobs:
        org = org_repo.get_by_id(j.get("organizationId"))
        j_copy = dict(j)
        j_copy["organizationName"] = org.get("name") if org else "AURA Partner"
        enriched.append(j_copy)

    return {"jobs": enriched}

@router.get("/{job_id}")
def get_job(job_id: str):
    job = job_repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job role not found")
    org = org_repo.get_by_id(job.get("organizationId"))
    res = dict(job)
    res["organizationName"] = org.get("name") if org else "AURA Partner"
    return {"job": res}

@router.post("")
def create_job(req: CreateJobRequest, user: dict = Depends(get_current_user)):
    org_id = user.get("organizationId") or "org_aurelia"
    job_id = f"job_{int(datetime.now().timestamp() * 1000)}"
    new_job = {
        "id": job_id,
        "organizationId": org_id,
        "title": req.title.strip(),
        "description": req.description.strip(),
        "skills": req.skills,
        "interviewLevel": req.interviewLevel.value if hasattr(req.interviewLevel, 'value') else req.interviewLevel,
        "duration": req.duration,
        "competencies": [c.model_dump() if hasattr(c, 'model_dump') else dict(c) for c in req.competencies],
        "status": "ACTIVE",
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    created = job_repo.create(new_job)
    return {"success": True, "job": created}
