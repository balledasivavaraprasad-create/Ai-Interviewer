from typing import List, Optional
from enum import Enum
from pydantic import BaseModel

class InterviewLevel(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"

class Competency(BaseModel):
    name: str
    description: str
    weight: int = 20  # Percentage weight (sum approx 100)

class JobRole(BaseModel):
    id: str
    organizationId: str
    title: str
    description: str
    skills: List[str]
    interviewLevel: InterviewLevel = InterviewLevel.INTERMEDIATE
    duration: int = 30  # Duration in minutes
    competencies: List[Competency]
    status: str = "ACTIVE"
    createdAt: str

class CreateJobRequest(BaseModel):
    title: str
    description: str
    skills: List[str]
    interviewLevel: InterviewLevel = InterviewLevel.INTERMEDIATE
    duration: int = 30
    competencies: List[Competency]
