from fastapi import APIRouter, HTTPException, status
from app.repositories.organization_repository import org_repo

router = APIRouter(prefix="/organizations", tags=["organizations"])

@router.get("")
def list_organizations():
    orgs = org_repo.list_all()
    return {"organizations": orgs}

@router.get("/{org_id}")
def get_organization(org_id: str):
    org = org_repo.get_by_id(org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return {"organization": org}
