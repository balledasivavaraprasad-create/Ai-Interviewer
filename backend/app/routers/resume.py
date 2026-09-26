from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.resume_service import resume_service

router = APIRouter(prefix="/resume", tags=["resume"])

@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")

    content = await file.read()
    if file.filename.lower().endswith(".pdf"):
        text = resume_service.extract_text_from_pdf(content)
    else:
        text = content.decode("utf-8", errors="ignore")

    profile = resume_service.parse_profile(text)
    return {
        "success": True,
        "filename": file.filename,
        "profile": profile,
        "extractedText": text
    }
