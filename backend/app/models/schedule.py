from typing import Optional
from enum import Enum
from pydantic import BaseModel
from app.models.job import InterviewLevel

class ScheduleStatus(str, Enum):
    UPCOMING = "UPCOMING"
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"

class Schedule(BaseModel):
    id: str
    organizationId: str
    jobRoleId: str
    jobTitle: Optional[str] = None
    interviewLevel: InterviewLevel = InterviewLevel.INTERMEDIATE
    date: str  # YYYY-MM-DD
    startTime: str  # HH:MM (24-hour)
    endTime: str  # HH:MM (24-hour)
    timezone: str = "Asia/Kolkata"
    duration: int = 30  # minutes per interview
    capacity: int = 10
    bookedCount: int = 0
    status: ScheduleStatus = ScheduleStatus.UPCOMING
    createdAt: str

class CreateScheduleRequest(BaseModel):
    jobRoleId: str
    date: str
    startTime: str
    endTime: str
    timezone: str = "Asia/Kolkata"
    duration: int = 30
    capacity: int = 10
