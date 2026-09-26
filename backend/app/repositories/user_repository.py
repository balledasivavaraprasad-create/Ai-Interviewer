from typing import Optional, Dict, Any
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__("users")
        self._otps: Dict[str, Dict[str, Any]] = {}

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        norm_email = email.lower().strip()
        col = self.collection
        if col is not None:
            doc = col.find_one({"email": norm_email})
            if doc:
                return self.clean_doc(doc)
        return self._memory_store.get(norm_email)

    def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        col = self.collection
        if col is not None:
            doc = col.find_one({"id": user_id})
            if doc:
                return self.clean_doc(doc)
        for u in self._memory_store.values():
            if u.get("id") == user_id:
                return u
        return None

    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        norm_email = user_data["email"].lower().strip()
        user_data["email"] = norm_email
        col = self.collection
        if col is not None:
            col.update_one({"email": norm_email}, {"$set": user_data}, upsert=True)
        self._memory_store[norm_email] = user_data
        return user_data

    def verify_user(self, email: str) -> bool:
        norm_email = email.lower().strip()
        col = self.collection
        if col is not None:
            col.update_one({"email": norm_email}, {"$set": {"isVerified": True}})
        if norm_email in self._memory_store:
            self._memory_store[norm_email]["isVerified"] = True
            return True
        return True

    def save_otp(self, email: str, otp: str, expires_at: str, purpose: str = "signup"):
        norm_email = email.lower().strip()
        data = {"email": norm_email, "otp": otp, "expiresAt": expires_at, "purpose": purpose}
        col = self.collection
        if col is not None:
            col.database["otps"].update_one({"email": norm_email}, {"$set": data}, upsert=True)
        self._otps[norm_email] = data

    def get_otp(self, email: str) -> Optional[Dict[str, Any]]:
        norm_email = email.lower().strip()
        col = self.collection
        if col is not None:
            doc = col.database["otps"].find_one({"email": norm_email})
            if doc:
                return self.clean_doc(doc)
        return self._otps.get(norm_email)

    def delete_otp(self, email: str):
        norm_email = email.lower().strip()
        col = self.collection
        if col is not None:
            col.database["otps"].delete_one({"email": norm_email})
        if norm_email in self._otps:
            del self._otps[norm_email]

user_repo = UserRepository()
