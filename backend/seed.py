import sys
import os
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.database import get_database
from app.services.auth_service import auth_service
from app.repositories.organization_repository import org_repo
from app.repositories.user_repository import user_repo
from app.repositories.job_repository import job_repo
from app.repositories.schedule_repository import schedule_repo

def seed_database():
    print("==================================================")
    print(" AURA · TALENT — Idempotent Database Seed Script")
    print("==================================================")

    db = get_database()
    print(f"Connecting to MongoDB database '{settings.DATABASE_NAME}'...")

    # 1. Seed Organizations
    organizations = [
        {
            "id": "org_aurelia",
            "name": "Aurelia Systems",
            "slug": "aurelia-systems",
            "description": "High-throughput financial technology and cloud infrastructure engineering.",
            "industry": "FinTech / Enterprise Cloud",
            "status": "ACTIVE",
            "createdAt": "2026-01-15T00:00:00Z"
        },
        {
            "id": "org_northstar",
            "name": "Northstar Labs",
            "slug": "northstar-labs",
            "description": "Applied AI research and autonomous multi-agent intelligence platforms.",
            "industry": "Artificial Intelligence / ML",
            "status": "ACTIVE",
            "createdAt": "2026-01-20T00:00:00Z"
        },
        {
            "id": "org_vertex",
            "name": "Vertex Dynamics",
            "slug": "vertex-dynamics",
            "description": "Next-generation design systems, web performance, and developer tooling.",
            "industry": "Developer Tools & UI Systems",
            "status": "ACTIVE",
            "createdAt": "2026-02-01T00:00:00Z"
        },
        {
            "id": "org_nimbus",
            "name": "Nimbus Digital",
            "slug": "nimbus-digital",
            "description": "Mission-critical site reliability engineering, Kubernetes, and edge compute.",
            "industry": "DevOps & Cloud SRE",
            "status": "ACTIVE",
            "createdAt": "2026-02-10T00:00:00Z"
        },
        {
            "id": "org_orion",
            "name": "Orion Technologies",
            "slug": "orion-technologies",
            "description": "Distributed storage engines and low-latency global transactional fabrics.",
            "industry": "Systems Architecture & Database Engines",
            "status": "ACTIVE",
            "createdAt": "2026-02-15T00:00:00Z"
        }
    ]

    for org in organizations:
        org_repo.upsert(org)
    print(f"✓ Seeded {len(organizations)} demo organizations.")

    # 2. Seed Default Recruiter and Candidate Accounts
    recruiter_pwd = auth_service.hash_password("Aurelia2026!")
    candidate_pwd = auth_service.hash_password("Candidate2026!")

    users = [
        {
            "id": "usr_recruiter_aurelia",
            "email": "recruiter@aurelia-demo.local",
            "name": "Elena Rostova (Head of Talent)",
            "role": "RECRUITER",
            "hashed_password": recruiter_pwd,
            "organizationId": "org_aurelia",
            "isVerified": True,
            "createdAt": "2026-01-15T00:00:00Z"
        },
        {
            "id": "usr_recruiter_northstar",
            "email": "recruiter@northstar-demo.local",
            "name": "Marcus Vance (Engineering Director)",
            "role": "RECRUITER",
            "hashed_password": recruiter_pwd,
            "organizationId": "org_northstar",
            "isVerified": True,
            "createdAt": "2026-01-20T00:00:00Z"
        },
        {
            "id": "usr_candidate_jane",
            "email": "candidate@demo.local",
            "name": "Jane Doe (Lead Engineer)",
            "role": "CANDIDATE",
            "hashed_password": candidate_pwd,
            "organizationId": None,
            "isVerified": True,
            "createdAt": "2026-02-01T00:00:00Z"
        }
    ]

    for u in users:
        user_repo.create_user(u)
    print(f"✓ Seeded {len(users)} default demo accounts (recruiter & candidate).")

    # 3. Seed Job Roles
    jobs = [
        {
            "id": "job_aurelia_backend",
            "organizationId": "org_aurelia",
            "title": "Backend Engineer",
            "description": "Architect distributed microservices, optimize low-latency database queries, and build robust fault-tolerant APIs.",
            "skills": ["Python", "FastAPI", "PostgreSQL", "Redis", "Distributed Systems", "Docker"],
            "interviewLevel": "ADVANCED",
            "duration": 30,
            "competencies": [
                {"name": "API Design", "description": "RESTful & gRPC interface contracts, pagination, error models", "weight": 25},
                {"name": "Databases", "description": "Schema indexing, connection pools, transactional isolation", "weight": 20},
                {"name": "System Design", "description": "Horizontal scaling, load balancing, idempotency", "weight": 25},
                {"name": "Scalability", "description": "Caching layers, queue decouplers, latency mitigation", "weight": 15},
                {"name": "Debugging", "description": "Root cause analysis, distributed tracing, profiling", "weight": 15}
            ],
            "status": "ACTIVE",
            "createdAt": "2026-02-01T00:00:00Z"
        },
        {
            "id": "job_northstar_mle",
            "organizationId": "org_northstar",
            "title": "Machine Learning Engineer",
            "description": "Deploy foundation model pipelines, evaluate embeddings and vector retrieval, and design low-latency inference services.",
            "skills": ["Python", "PyTorch", "Transformers", "Vector Databases", "MLOps", "FastAPI"],
            "interviewLevel": "INTERMEDIATE",
            "duration": 30,
            "competencies": [
                {"name": "ML Fundamentals", "description": "Loss functions, optimization, overfitting countermeasures", "weight": 25},
                {"name": "Model Evaluation", "description": "Precision, recall, latency benchmarks, hallucination detection", "weight": 20},
                {"name": "Python", "description": "NumPy vectorized operations, memory efficiency, async pipelines", "weight": 20},
                {"name": "Data Processing", "description": "ETL pipelines, tokenization, feature stores", "weight": 15},
                {"name": "Problem Solving", "description": "Tradeoff evaluation between accuracy and computational cost", "weight": 20}
            ],
            "status": "ACTIVE",
            "createdAt": "2026-02-05T00:00:00Z"
        },
        {
            "id": "job_vertex_frontend",
            "organizationId": "org_vertex",
            "title": "Frontend Engineer",
            "description": "Build high-craft user interfaces, fluid animations, accessible design systems, and responsive WebGL components.",
            "skills": ["JavaScript", "TypeScript", "React", "CSS Architecture", "WebGL / Three.js"],
            "interviewLevel": "BEGINNER",
            "duration": 30,
            "competencies": [
                {"name": "JavaScript", "description": "Closures, event loop, promises, ES6+ idioms", "weight": 30},
                {"name": "React", "description": "State management, hooks, render lifecycle, memoization", "weight": 30},
                {"name": "UI Architecture", "description": "Component hierarchy, CSS tokens, responsiveness", "weight": 20},
                {"name": "Debugging", "description": "Browser devtools, profiling re-renders, layout shifts", "weight": 20}
            ],
            "status": "ACTIVE",
            "createdAt": "2026-02-10T00:00:00Z"
        },
        {
            "id": "job_nimbus_devops",
            "organizationId": "org_nimbus",
            "title": "DevOps Engineer",
            "description": "Orchestrate Kubernetes clusters, automate multi-stage CI/CD pipelines, and guarantee 99.99% infrastructure uptime.",
            "skills": ["Docker", "Kubernetes", "Terraform", "GitHub Actions", "Prometheus", "GCP"],
            "interviewLevel": "ADVANCED",
            "duration": 30,
            "competencies": [
                {"name": "Docker", "description": "Multi-stage builds, image security, layer optimization", "weight": 25},
                {"name": "CI/CD", "description": "Automated testing pipelines, canary deployments, rollbacks", "weight": 25},
                {"name": "Cloud", "description": "IAM least privilege, VPC peering, cloud-native networking", "weight": 20},
                {"name": "Monitoring", "description": "Metrics, alerting thresholds, distributed telemetry", "weight": 15},
                {"name": "Infrastructure", "description": "Infrastructure as Code, state drift remediation", "weight": 15}
            ],
            "status": "ACTIVE",
            "createdAt": "2026-02-12T00:00:00Z"
        },
        {
            "id": "job_orion_software",
            "organizationId": "org_orion",
            "title": "Software Engineer",
            "description": "Solve high-complexity algorithmic challenges and build distributed transactional consensus systems.",
            "skills": ["Go", "C++", "Distributed Systems", "Algorithms", "Concurrency"],
            "interviewLevel": "EXPERT",
            "duration": 45,
            "competencies": [
                {"name": "Algorithms", "description": "Data structure optimization, complexity trade-offs", "weight": 25},
                {"name": "Architecture", "description": "Consensus protocols, Raft/Paxos, fault-tolerant replication", "weight": 30},
                {"name": "System Design", "description": "Partitioning, read/write replication, high availability", "weight": 25},
                {"name": "Problem Solving", "description": "Ambiguous edge-case handling under catastrophic network partition", "weight": 20}
            ],
            "status": "ACTIVE",
            "createdAt": "2026-02-15T00:00:00Z"
        }
    ]

    for j in jobs:
        job_repo.create(j)
    print(f"✓ Seeded {len(jobs)} role specifications across multiple levels.")

    # 4. Seed Dynamic Authoritative Schedules (Asia/Kolkata +05:30)
    # Calculate relative times so schedules accurately illustrate OPEN, UPCOMING, and EXPIRED right now
    now_utc = datetime.now(timezone.utc)
    ist = timezone(timedelta(hours=5, minutes=30))
    now_ist = now_utc.astimezone(ist)
    today_str = now_ist.strftime("%Y-%m-%d")
    tomorrow_str = (now_ist + timedelta(days=1)).strftime("%Y-%m-%d")
    yesterday_str = (now_ist - timedelta(days=1)).strftime("%Y-%m-%d")

    # Schedule 1: OPEN RIGHT NOW (Started 30 min ago, ends 1 hour from now)
    open_start = (now_ist - timedelta(minutes=30)).strftime("%H:%M")
    open_end = (now_ist + timedelta(minutes=60)).strftime("%H:%M")

    # Schedule 2: UPCOMING TODAY (Starts in 2 hours)
    upcoming_start = (now_ist + timedelta(hours=2)).strftime("%H:%M")
    upcoming_end = (now_ist + timedelta(hours=3)).strftime("%H:%M")

    # Schedule 3: UPCOMING TOMORROW
    tomorrow_start = "10:00"
    tomorrow_end = "12:00"

    # Schedule 4: EXPIRED YESTERDAY
    past_start = "09:00"
    past_end = "10:00"

    schedules = [
        {
            "id": "sch_aurelia_open_now",
            "organizationId": "org_aurelia",
            "jobRoleId": "job_aurelia_backend",
            "jobTitle": "Backend Engineer",
            "interviewLevel": "ADVANCED",
            "date": today_str,
            "startTime": open_start,
            "endTime": open_end,
            "timezone": "Asia/Kolkata",
            "duration": 30,
            "capacity": 10,
            "bookedCount": 2,
            "status": "OPEN",
            "createdAt": "2026-02-20T00:00:00Z"
        },
        {
            "id": "sch_northstar_upcoming",
            "organizationId": "org_northstar",
            "jobRoleId": "job_northstar_mle",
            "jobTitle": "Machine Learning Engineer",
            "interviewLevel": "INTERMEDIATE",
            "date": today_str,
            "startTime": upcoming_start,
            "endTime": upcoming_end,
            "timezone": "Asia/Kolkata",
            "duration": 30,
            "capacity": 8,
            "bookedCount": 3,
            "status": "UPCOMING",
            "createdAt": "2026-02-20T00:00:00Z"
        },
        {
            "id": "sch_vertex_tomorrow",
            "organizationId": "org_vertex",
            "jobRoleId": "job_vertex_frontend",
            "jobTitle": "Frontend Engineer",
            "interviewLevel": "BEGINNER",
            "date": tomorrow_str,
            "startTime": tomorrow_start,
            "endTime": tomorrow_end,
            "timezone": "Asia/Kolkata",
            "duration": 30,
            "capacity": 12,
            "bookedCount": 1,
            "status": "UPCOMING",
            "createdAt": "2026-02-20T00:00:00Z"
        },
        {
            "id": "sch_nimbus_expired",
            "organizationId": "org_nimbus",
            "jobRoleId": "job_nimbus_devops",
            "jobTitle": "DevOps Engineer",
            "interviewLevel": "ADVANCED",
            "date": yesterday_str,
            "startTime": past_start,
            "endTime": past_end,
            "timezone": "Asia/Kolkata",
            "duration": 30,
            "capacity": 5,
            "bookedCount": 5,
            "status": "EXPIRED",
            "createdAt": "2026-02-18T00:00:00Z"
        },
        {
            "id": "sch_orion_cancelled",
            "organizationId": "org_orion",
            "jobRoleId": "job_orion_software",
            "jobTitle": "Software Engineer",
            "interviewLevel": "EXPERT",
            "date": today_str,
            "startTime": "18:00",
            "endTime": "19:00",
            "timezone": "Asia/Kolkata",
            "duration": 45,
            "capacity": 6,
            "bookedCount": 0,
            "status": "CANCELLED",
            "createdAt": "2026-02-18T00:00:00Z"
        }
    ]

    for s in schedules:
        schedule_repo.create(s)
    print(f"✓ Seeded {len(schedules)} realistic schedules (OPEN, UPCOMING, EXPIRED, CANCELLED).")

    print("\n✓ Database seeding completed successfully and idempotently!")

if __name__ == "__main__":
    seed_database()
