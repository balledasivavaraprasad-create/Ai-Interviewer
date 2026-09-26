from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from app.models.interview import StartSessionRequest
from app.repositories.interview_repository import interview_repo
from app.repositories.schedule_repository import schedule_repo
from app.repositories.job_repository import job_repo
from app.repositories.organization_repository import org_repo
from app.services.schedule_service import schedule_service
from app.services.gemini_service import gemini_service
from app.services.evaluation_service import evaluation_service
from app.routers.deps import get_current_user

router = APIRouter(prefix="/interviews", tags=["interviews"])

class CandidateAnswerRequest(BaseModel):
    answerText: str
    currentQuestionText: str
    currentCompetency: Optional[str] = None

class IntegrityEventRequest(BaseModel):
    eventType: str
    timestamp: str
    duration: float
    confidence: float
    metadata: Optional[Dict[str, Any]] = None

@router.post("/start")
def start_interview_session(req: StartSessionRequest, user: dict = Depends(get_current_user)):
    candidate_id = user.get("id", "cand_demo")
    candidate_name = user.get("name", "Candidate")
    candidate_email = user.get("email", "candidate@demo.local")

    is_practice = req.isPractice or not req.scheduleId

    # Official interview access control
    schedule_data = None
    job_data = None
    org_data = None

    if not is_practice:
        # Check active session refresh protection
        existing_active = interview_repo.find_active_official(candidate_id, req.scheduleId)
        if existing_active:
            print(f"[SESSION] Resuming existing active session {existing_active['id']} for candidate {candidate_id}")
            return {"success": True, "resumed": True, "session": existing_active}

        # Server-authoritative time and capacity check
        valid, eval_schedule, msg = schedule_service.validate_candidate_access(req.scheduleId)
        if not valid:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=msg)

        schedule_data = eval_schedule
        job_data = job_repo.get_by_id(schedule_data.get("jobRoleId"))
        org_data = org_repo.get_by_id(schedule_data.get("organizationId"))

        # Increment booked count atomically
        schedule_repo.increment_booked(req.scheduleId)
    else:
        # Practice mode setup
        if req.jobRoleId:
            job_data = job_repo.get_by_id(req.jobRoleId)
            if job_data:
                org_data = org_repo.get_by_id(job_data.get("organizationId"))

    interviewer_gender = req.interviewerGender.lower()
    interviewer_name = "Sarah Chen" if interviewer_gender == "female" else "David Kim"

    role_title = job_data.get("title") if job_data else (req.targetJob or "Full Stack Engineer")
    org_name = org_data.get("name") if org_data else "AURA Executive Practice"
    interview_level = job_data.get("interviewLevel") if job_data else "INTERMEDIATE"
    duration = job_data.get("duration", 30) if job_data else 30
    competencies = job_data.get("competencies") if job_data else [
        {"name": "System Design", "description": "Architecture and scalability", "weight": 40},
        {"name": "Problem Solving", "description": "Logic, algorithms and debugging", "weight": 35},
        {"name": "Communication", "description": "Clarity and collaboration", "weight": 25}
    ]

    now_iso = datetime.now(timezone.utc).isoformat()
    session_id = f"sess_{int(datetime.now().timestamp() * 1000)}"

    session_doc = {
        "id": session_id,
        "candidateId": candidate_id,
        "candidateName": candidate_name,
        "candidateEmail": candidate_email,
        "organizationId": org_data.get("id") if org_data else None,
        "organizationName": org_name,
        "jobRoleId": job_data.get("id") if job_data else None,
        "jobRoleTitle": role_title,
        "scheduleId": req.scheduleId if not is_practice else None,
        "isPractice": is_practice,
        "interviewerGender": interviewer_gender,
        "interviewerName": interviewer_name,
        "interviewLevel": interview_level,
        "duration": duration,
        "startedAt": now_iso,
        "endedAt": None,
        "status": "IN_PROGRESS",
        "competencySnapshot": competencies,
        "currentCompetency": competencies[0]["name"] if competencies else "Technical Reasoning",
        "questionCount": 0,
        "transcript": [],
        "evidence": [],
        "integrityEvents": [],
        "createdAt": now_iso
    }

    # Generate initial question via Gemini
    initial_q_data = gemini_service.generate_question({
        "jobRoleTitle": role_title,
        "organizationName": org_name,
        "interviewLevel": interview_level,
        "competencies": [c["name"] for c in competencies],
        "transcript": [],
        "questionCount": 0,
        "resumeText": req.resumeText or "",
        "duration": duration
    })

    q_text = initial_q_data.get("question")
    target_comp = initial_q_data.get("competency", session_doc["currentCompetency"])

    transcript_item = {
        "speaker": "INTERVIEWER",
        "text": q_text,
        "timestamp": now_iso,
        "questionId": "q_1",
        "competency": target_comp
    }
    session_doc["transcript"].append(transcript_item)
    session_doc["questionCount"] = 1
    session_doc["currentCompetency"] = target_comp
    session_doc["currentQuestion"] = q_text

    created_session = interview_repo.create(session_doc)
    return {"success": True, "resumed": False, "session": created_session}

@router.get("/{session_id}")
def get_interview_session(session_id: str):
    session = interview_repo.get_by_id(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return {"session": session}

@router.post("/{session_id}/answer")
def submit_answer(session_id: str, req: CandidateAnswerRequest):
    session = interview_repo.get_by_id(session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    now_iso = datetime.now(timezone.utc).isoformat()
    competency = req.currentCompetency or session.get("currentCompetency", "System Design")

    # 1. Record candidate answer in transcript
    ans_item = {
        "speaker": "CANDIDATE",
        "text": req.answerText.strip(),
        "timestamp": now_iso,
        "competency": competency
    }
    interview_repo.append_transcript(session_id, ans_item)
    session.setdefault("transcript", []).append(ans_item)

    # 2. Evaluate answer against competency
    eval_res = gemini_service.evaluate_answer(
        question=req.currentQuestionText,
        answer=req.answerText,
        competency=competency,
        level=session.get("interviewLevel", "INTERMEDIATE")
    )
    evidence_item = {
        "competency": competency,
        "evidence": eval_res.get("evidence", "Candidate articulated response to technical inquiry."),
        "gap": eval_res.get("gaps", [""])[0] if eval_res.get("gaps") else None,
        "score": eval_res.get("score", 7.5)
    }
    interview_repo.append_evidence(session_id, evidence_item)
    session.setdefault("evidence", []).append(evidence_item)

    # 3. Check if interview duration/question limit reached (e.g. 5-6 questions for demo)
    q_count = session.get("questionCount", 1)
    if q_count >= 5:
        # Trigger closing
        closing_item = {
            "speaker": "INTERVIEWER",
            "text": "Thank you for sharing your technical experience with us today. That concludes our questions for this session. We are now finalizing your evaluation.",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "questionId": f"q_{q_count+1}",
            "competency": "Summary"
        }
        interview_repo.append_transcript(session_id, closing_item)
        interview_repo.update_session(session_id, {
            "isCompleted": True,
            "currentQuestion": closing_item["text"]
        })
        return {
            "success": True,
            "completed": True,
            "nextQuestion": closing_item["text"],
            "competency": "Summary"
        }

    # 4. Generate next adaptive question
    competency_names = [c["name"] for c in session.get("competencySnapshot", [])]
    next_q_data = gemini_service.generate_question({
        "jobRoleTitle": session.get("jobRoleTitle"),
        "organizationName": session.get("organizationName"),
        "interviewLevel": session.get("interviewLevel"),
        "competencies": competency_names,
        "transcript": session.get("transcript", []),
        "questionCount": q_count,
        "duration": session.get("duration", 30)
    })

    next_q = next_q_data.get("question")
    next_comp = next_q_data.get("competency", competency)
    next_count = q_count + 1

    q_item = {
        "speaker": "INTERVIEWER",
        "text": next_q,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "questionId": f"q_{next_count}",
        "competency": next_comp
    }
    interview_repo.append_transcript(session_id, q_item)
    interview_repo.update_session(session_id, {
        "questionCount": next_count,
        "currentCompetency": next_comp,
        "currentQuestion": next_q
    })

    return {
        "success": True,
        "completed": False,
        "nextQuestion": next_q,
        "competency": next_comp,
        "difficulty": next_q_data.get("difficulty", 3),
        "action": next_q_data.get("action", "PROBE_DEEPER")
    }

@router.post("/{session_id}/integrity")
def record_integrity(session_id: str, req: IntegrityEventRequest):
    event = {
        "eventType": req.eventType,
        "timestamp": req.timestamp,
        "duration": req.duration,
        "confidence": req.confidence,
        "metadata": req.metadata or {}
    }
    interview_repo.append_integrity_event(session_id, event)
    return {"success": True}

@router.post("/{session_id}/complete")
def complete_interview(session_id: str):
    cand_rep, rec_rep = evaluation_service.finalize_session_and_generate_reports(session_id)
    return {
        "success": True,
        "candidateReport": cand_rep,
        "recruiterReport": rec_rep
    }

@router.get("/candidate/{candidate_id}")
def list_candidate_interviews(candidate_id: str):
    sessions = interview_repo.list_by_candidate(candidate_id)
    return {"sessions": sessions}

@router.get("/org/{org_id}")
def list_org_interviews(org_id: str):
    sessions = interview_repo.list_by_org(org_id)
    return {"sessions": sessions}
