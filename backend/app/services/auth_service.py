import os
import random
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
from jose import jwt, JWTError
from app.config import settings
from app.repositories.user_repository import user_repo

class AuthService:
    def hash_password(self, password: str) -> str:
        # bcrypt requires bytes, max 72 bytes
        pwd_bytes = password.encode('utf-8')[:72]
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            plain_bytes = plain_password.encode('utf-8')[:72]
            hash_bytes = hashed_password.encode('utf-8')
            return bcrypt.checkpw(plain_bytes, hash_bytes)
        except Exception:
            return False

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt

    def decode_token(self, token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except JWTError:
            return None

    def generate_otp(self) -> str:
        return f"{random.randint(100000, 999999)}"

    def initiate_signup(self, name: str, email: str, password: str, role: str, org_id: Optional[str] = None) -> Tuple[bool, str]:
        existing = user_repo.get_by_email(email)
        if existing and existing.get("isVerified"):
            return False, "An account with this email already exists."

        hashed = self.hash_password(password)
        user_id = existing["id"] if existing else f"user_{int(datetime.now().timestamp() * 1000)}"
        user_data = {
            "id": user_id,
            "email": email.lower().strip(),
            "name": name.strip(),
            "role": role,
            "hashed_password": hashed,
            "organizationId": org_id,
            "isVerified": False,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        user_repo.create_user(user_data)

        # Generate 6-digit OTP
        otp = self.generate_otp()
        expires = (datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)).isoformat()
        user_repo.save_otp(email, otp, expires, purpose="signup")
        print(f"[AUTH] Generated 2FA OTP for {email}: {otp}")
        return True, otp

    def verify_otp(self, email: str, otp: str) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        record = user_repo.get_otp(email)
        if not record:
            return False, None, "No OTP pending for this email. Please request a new code."

        if record.get("otp") != otp.strip():
            return False, None, "Invalid verification code. Please check and try again."

        # Check expiration
        expires_at = datetime.fromisoformat(record["expiresAt"])
        if datetime.now(timezone.utc) > expires_at:
            return False, None, "Verification code has expired. Please request a new one."

        # Mark user verified
        user_repo.verify_user(email)
        user_repo.delete_otp(email)
        user = user_repo.get_by_email(email)
        if not user:
            return False, None, "User record not found."

        token = self.create_access_token({
            "sub": user["id"],
            "email": user["email"],
            "role": user["role"],
            "name": user["name"],
            "orgId": user.get("organizationId")
        })

        safe_user = {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "organizationId": user.get("organizationId")
        }
        return True, {"token": token, "user": safe_user}, "Account verified successfully."

    def resend_otp(self, email: str) -> Tuple[bool, str]:
        user = user_repo.get_by_email(email)
        if not user:
            return False, "No registration found with this email."
        otp = self.generate_otp()
        expires = (datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)).isoformat()
        user_repo.save_otp(email, otp, expires, purpose="resend")
        print(f"[AUTH] Resent 2FA OTP for {email}: {otp}")
        return True, "A new 6-digit verification code has been generated."

    def login(self, email: str, password: str, expected_role: Optional[str] = None) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        user = user_repo.get_by_email(email)
        if not user:
            return False, None, "Invalid email or password."

        if not self.verify_password(password, user["hashed_password"]):
            return False, None, "Invalid email or password."

        # Validate role if specified
        if expected_role and user.get("role") != expected_role:
            return False, None, f"This account is registered as a {user.get('role').lower()}, not a {expected_role.lower()}."

        token = self.create_access_token({
            "sub": user["id"],
            "email": user["email"],
            "role": user["role"],
            "name": user["name"],
            "orgId": user.get("organizationId")
        })

        safe_user = {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "organizationId": user.get("organizationId")
        }
        return True, {"token": token, "user": safe_user}, "Login successful."

auth_service = AuthService()
