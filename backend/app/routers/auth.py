from fastapi import APIRouter, HTTPException, Depends, status
from app.models.auth import SignupRequest, LoginRequest, VerifyOtpRequest, ResendOtpRequest
from app.services.auth_service import auth_service
from app.routers.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup")
def signup(req: SignupRequest):
    success, result = auth_service.initiate_signup(
        name=req.name,
        email=req.email,
        password=req.password,
        role=req.role.value if hasattr(req.role, 'value') else req.role,
        org_id=req.organizationId
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result)
    return {
        "success": True,
        "message": f"Verification code sent to {req.email}",
        "email": req.email
    }

@router.post("/verify-otp")
def verify_otp(req: VerifyOtpRequest):
    success, data, msg = auth_service.verify_otp(req.email, req.otp)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return {
        "success": True,
        "token": data["token"],
        "user": data["user"],
        "message": msg
    }

@router.post("/resend-otp")
def resend_otp(req: ResendOtpRequest):
    success, msg = auth_service.resend_otp(req.email)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return {"success": True, "message": msg}

@router.post("/login")
def login(req: LoginRequest):
    expected_role = req.role.value if req.role and hasattr(req.role, 'value') else req.role
    success, data, msg = auth_service.login(req.email, req.password, expected_role=expected_role)
    if not success:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)
    return {
        "success": True,
        "token": data["token"],
        "user": data["user"],
        "message": msg
    }

@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    return {"user": user}
