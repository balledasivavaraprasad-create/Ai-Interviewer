from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.models.interview import TranscriptItem, IntegrityEvent

class CompetencyScore(BaseModel):
    competency: str
    score: float  # out of 10
    weight: int
    strengths: List[str]
    gaps: List[str]
    evidence: List[str]

class CandidateReport(BaseModel):
    id: str
    sessionId: str
    roleTitle: str
    organizationName: Optional[str] = None
    level: str
    date: str
    overallScore: float
    performanceSummary: str
    competencies: List[CompetencyScore]
    keyStrengths: List[str]
    growthAreas: List[str]
    practiceRecommendations: List[str]
    createdAt: str

class RecruiterReport(BaseModel):
    id: str
    sessionId: str
    candidateName: str
    candidateEmail: str
    organizationName: str
    roleTitle: str
    level: str
    interviewDate: str
    durationMinutes: int
    overallScore: float
    hiringRecommendation: str  # STRONG_HIRE, HIRE, LEAN_HIRE, DO_NOT_HIRE
    summary: str
    competencyBreakdown: List[CompetencyScore]
    strengths: List[str]
    gaps: List[str]
    transcript: List[TranscriptItem]
    integrityTimeline: List[IntegrityEvent]
    reportGeneratedAt: str
