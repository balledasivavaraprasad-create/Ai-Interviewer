from typing import Optional, List
from pydantic import BaseModel

class Organization(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    logo: Optional[str] = None
    industry: str
    status: str = "ACTIVE"
    createdAt: str

class Recruiter(BaseModel):
    id: str
    userId: str
    organizationId: str
    name: str
    email: str
    role: str = "RECRUITER"
    createdAt: str
