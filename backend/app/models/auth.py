from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field

class UserRole(str, Enum):
    CANDIDATE = "CANDIDATE"
    RECRUITER = "RECRUITER"
    ORGANIZATION_ADMIN = "ORGANIZATION_ADMIN"

class User(BaseModel):
    id: str
    email: str
    name: str
    role: UserRole
    hashed_password: str
    organizationId: Optional[str] = None
    isVerified: bool = False
    createdAt: str

class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[UserRole] = None

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole = UserRole.CANDIDATE
    organizationId: Optional[str] = None
    termsAccepted: bool = False

class VerifyOtpRequest(BaseModel):
    email: str
    otp: str

class ResendOtpRequest(BaseModel):
    email: str

class AuthResponse(BaseModel):
    token: str
    user: dict
    message: Optional[str] = None

class OtpRecord(BaseModel):
    email: str
    otp: str
    expiresAt: str
    purpose: str = "signup"
