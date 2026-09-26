import io
import re
from typing import Dict, Any, List
import pypdf

class ResumeService:
    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            return text.strip()
        except Exception as e:
            print(f"[RESUME] PDF parse warning: {e}")
            try:
                # Text fallback
                return file_bytes.decode("utf-8", errors="ignore")
            except Exception:
                return ""

    def parse_profile(self, text: str) -> Dict[str, Any]:
        """
        Parses structured candidate profile information from raw text.
        """
        lines = [line.strip() for line in text.split("\n") if line.strip()]

        common_skills = [
            "python", "javascript", "typescript", "react", "node.js", "docker",
            "kubernetes", "aws", "gcp", "sql", "postgresql", "mongodb", "redis",
            "graphql", "fastapi", "golang", "java", "c++", "system design",
            "microservices", "ci/cd", "git", "machine learning", "pytorch"
        ]

        found_skills = set()
        lower_text = text.lower()
        for skill in common_skills:
            if re.search(r'\b' + re.escape(skill) + r'\b', lower_text):
                found_skills.add(skill.title() if skill not in ["aws", "gcp", "sql"] else skill.upper())

        return {
            "skills": sorted(list(found_skills)),
            "rawText": text[:4000],
            "lineCount": len(lines),
            "summary": " ".join(lines[:3]) if lines else "Candidate profile loaded."
        }

resume_service = ResumeService()
