from fastapi import Header, HTTPException, status
from typing import Optional, Dict, Any
from app.services.auth_service import auth_service
from app.repositories.user_repository import user_repo

def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization:
        # Development fallback demo user
        return {
            "id": "candidate_demo_1",
            "email": "candidate@demo.local",
            "name": "Jane Doe (Demo Candidate)",
            "role": "CANDIDATE"
        }

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth scheme")
        payload = auth_service.decode_token(token)
        if not payload:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
        user = user_repo.get_by_id(payload.get("sub"))
        if not user:
            # Fallback to token payload
            return payload
        return {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "organizationId": user.get("organizationId")
        }
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
