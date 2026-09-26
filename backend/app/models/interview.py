from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel
from app.models.job import InterviewLevel, Competency

class SessionStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    WAITING = "WAITING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class IntegrityEvent(BaseModel):
    eventType: str  # e.g. OFF_SCREEN_ATTENTION, MULTIPLE_FACES, FACE_ABSENT
    timestamp: str
    duration: float  # in seconds
    confidence: float
    metadata: Optional[Dict[str, Any]] = None

class TranscriptItem(BaseModel):
    speaker: str  # INTERVIEWER or CANDIDATE
    text: str
    timestamp: str
    questionId: Optional[str] = None
    competency: Optional[str] = None

class EvidenceItem(BaseModel):
    competency: str
    evidence: str
    gap: Optional[str] = None
    score: float = 7.5  # 0 to 10

class InterviewSession(BaseModel):
    id: str
    candidateId: str
    candidateName: str
    candidateEmail: str
    organizationId: Optional[str] = None
    organizationName: Optional[str] = None
    jobRoleId: Optional[str] = None
    jobRoleTitle: Optional[str] = None
    scheduleId: Optional[str] = None
    isPractice: bool = False
    interviewerGender: str = "female"
    interviewerName: str = "Sarah Chen"
    interviewLevel: InterviewLevel = InterviewLevel.INTERMEDIATE
    duration: int = 30
    startedAt: Optional[str] = None
    endedAt: Optional[str] = None
    status: SessionStatus = SessionStatus.SCHEDULED
    competencySnapshot: List[Competency] = []
    currentCompetency: Optional[str] = None
    questionCount: int = 0
    transcript: List[TranscriptItem] = []
    evidence: List[EvidenceItem] = []
    integrityEvents: List[IntegrityEvent] = []
    createdAt: str

class StartSessionRequest(BaseModel):
    organizationId: Optional[str] = None
    jobRoleId: Optional[str] = None
    scheduleId: Optional[str] = None
    isPractice: bool = False
    interviewerGender: str = "female"
    targetJob: Optional[str] = None
    resumeText: Optional[str] = None
