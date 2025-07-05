import os
import json
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Request, Response, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import uvicorn
from typing import List, Dict, Any, Optional
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import re
from routers.academic import MOCK_COURSES

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("python-dotenv not installed. Using system environment variables only.")

from database import get_db, engine
from sqlalchemy import text
from models import (
    Base, User, UserRole, Course, Enrollment, EnrollmentStatus,
    CourseMaterial, Lesson, Assignment, AssignmentSubmission,
    Quiz, QuizQuestion, StudentQuizAttempt, StudentQuizAnswer,
    Message, Notification, Department, Program, Semester, SemesterType,
    ProgramLecturer, ProgramCourse
)
from auth import AuthManager, get_current_user
from services.gemini_service import GeminiService
from services.whisper_service import WhisperService
from services.gemini_speech_service import GeminiSpeechService

from services.quiz_service import QuizService
from services.pdf_service import PDFService

# MasterLMS Services
from services.academic_service import AcademicService
from services.user_management_service import UserManagementService
from services.discussion_service import DiscussionService
from services.communication_service import CommunicationService
from services.realtime_service import realtime_service, connection_manager

# Import logger
from logger import setup_logger, get_logger

# Import validation utilities
from utils.validation import (
    InputValidator, validate_user_registration,
    validate_course_creation, validate_assignment_creation
)

# Setup logging
setup_logger()
logger = get_logger(__name__)

# Validate environment variables
def validate_environment():
    required_vars = ["GEMINI_API_KEY", "DATABASE_URL", "JWT_SECRET_KEY"]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        logger.error(f"Missing required environment variables: {', '.join(missing)}")
        raise EnvironmentError(f"Missing required environment variables: {', '.join(missing)}")

# Call before app initialization
validate_environment()

# Create fresh database and seed data
def initialize_fresh_database():
    try:
        print("🗄️ Initializing fresh LMS database...")

        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")

        # Check if database is empty (needs seeding)
        db = next(get_db())
        try:
            user_count = db.query(User).count()
            if user_count == 0:
                print("📊 Database is empty, creating seed data...")
                # Import and run fresh seed data
                from fresh_seed_data import create_fresh_seed_data
                create_fresh_seed_data()
            else:
                print(f"📊 Database already has {user_count} users, skipping seed data")
        finally:
            db.close()

    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        # If there's an error, try to create tables anyway
        try:
            Base.metadata.create_all(bind=engine)
            print("✅ Tables created as fallback")
        except Exception as create_error:
            print(f"❌ Failed to create tables: {create_error}")

initialize_fresh_database()

app = FastAPI(title="EduFlow API", version="1.0.0", description="AI-Powered Learning Management System (Demo Mode)")

# Allow frontend origin(s)
origins = [
    "https://elearningmanagement.onrender.com",  # Your frontend domain
    "http://localhost:5173"                      # For local dev (optional)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for video materials
app.mount("/videos", StaticFiles(directory="uploads/videos"), name="videos")

# Initialize services
auth_manager = AuthManager()
gemini_service = GeminiService()
whisper_service = WhisperService()
gemini_speech_service = GeminiSpeechService()

quiz_service = QuizService()
pdf_service = PDFService()

# Initialize MasterLMS services
academic_service = AcademicService()
user_management_service = UserManagementService()
discussion_service = DiscussionService()
communication_service = CommunicationService()

# Pydantic models for request/response
from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class AskRequest(BaseModel):
    question: str

class QuizAnswers(BaseModel):
    answers: List[Dict[str, Any]]

# Removed CheckoutRequest - no longer needed without Stripe

class PaginationParams(BaseModel):
    page: int = 1
    limit: int = 20

# Authentication endpoints
from routers import auth, academic
app.include_router(auth.router, prefix="/api")
app.include_router(academic.router, prefix="/api/academic")

# AI and learning endpoints
@app.post("/api/ask")
async def ask_question(request: AskRequest, _current_user: User = Depends(get_current_user)):
    try:
        response = await gemini_service.get_response(request.question)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get AI response: {str(e)}")

@app.post("/api/voice")
async def transcribe_voice(audio: UploadFile = File(...), _current_user: User = Depends(get_current_user)):
    try:
        # Read audio file
        audio_content = await audio.read()

        # Try Gemini speech service first, fallback to Whisper if needed
        try:
            text = await gemini_speech_service.transcribe_audio(audio_content)
        except Exception as gemini_error:
            print(f"Gemini speech service failed: {gemini_error}")
            # Fallback to Whisper service
            text = await whisper_service.transcribe_audio(audio_content)

        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to transcribe audio: {str(e)}")

# PDF endpoints
@app.post("/api/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Read file content
        file_content = await file.read()

        # Process PDF
        result = await pdf_service.process_pdf_upload(
            db, current_user.id, file.filename or "document.pdf", file_content  # type: ignore
        )

        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["errors"])

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload PDF: {str(e)}")

@app.post("/api/chat-pdf")
async def chat_about_pdf(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        chat_session_id = request.get("chat_session_id")
        message = request.get("message", "")

        if not chat_session_id or not message:
            raise HTTPException(status_code=400, detail="chat_session_id and message are required")

        result = await pdf_service.chat_about_pdf(
            db, current_user.id, chat_session_id, message  # type: ignore
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to chat about PDF: {str(e)}")

@app.get("/api/user-pdfs")
async def get_user_pdfs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        pdfs = pdf_service.get_user_pdfs(db, current_user.id)  # type: ignore
        return {"pdfs": pdfs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get PDFs: {str(e)}")

@app.get("/api/chat-sessions")
async def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        sessions = pdf_service.get_chat_sessions(db, current_user.id)  # type: ignore
        return {"sessions": sessions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chat sessions: {str(e)}")

# Quiz endpoints
@app.get("/api/quiz")
async def get_quiz(
    chat_session_id: Optional[int] = None,
    difficulty: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Check if PDF-based quiz is requested
        if chat_session_id:
            questions = await quiz_service.generate_pdf_based_quiz(db, current_user.id, chat_session_id)  # type: ignore
        else:
            questions = quiz_service.generate_adaptive_quiz(db, current_user.id, difficulty)  # type: ignore
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {str(e)}")

@app.post("/api/submit-quiz")
async def submit_quiz(request: QuizAnswers, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        quiz_service.submit_quiz_results(db, current_user.id, request.answers)  # type: ignore
        return {"message": "Quiz submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit quiz: {str(e)}")

# Dashboard endpoint
@app.get("/api/dashboard")
async def get_dashboard_data(role: str = "admin"):
    """
    Demo endpoint for dashboard - returns mock data for admin, lecturer, or student
    """
    if role == "lecturer":
        return {
            "current_semester": {"id": 1, "name": "Spring 2024", "year": 2024},
            "courses": [
                {"id": 101, "name": "Introduction to Programming", "code": "CS101", "credits": 3, "department": "Computer Science", "max_capacity": 50, "enrolled_count": 45, "available_spots": 5},
                {"id": 102, "name": "Data Structures and Algorithms", "code": "CS201", "credits": 4, "department": "Computer Science", "max_capacity": 40, "enrolled_count": 38, "available_spots": 2}
            ],
            "pending_submissions": [
                {"id": 1, "assignment": "HW 1", "student": "Alice Smith", "course": "CS101", "submitted_at": "2024-02-10T10:00:00", "is_late": False, "days_since_submission": 2},
                {"id": 2, "assignment": "Project Proposal", "student": "Bob Smith", "course": "CS201", "submitted_at": "2024-02-09T15:00:00", "is_late": True, "days_since_submission": 3}
            ],
            "course_statistics": {
                "total_courses": 2,
                "total_students": 83,
                "total_assignments": 7,
                "average_class_size": 41.5
            }
        }
    elif role == "student":
        return {
            "current_semester": {"id": 1, "name": "Spring 2024", "year": 2024},
            "enrollments": [
                {"id": 1, "course": {"id": 101, "name": "Introduction to Programming", "code": "CS101", "credits": 3, "lecturer": "Dr. Sarah Johnson"}, "status": "enrolled", "final_grade": "A", "attendance_percentage": 95},
                {"id": 2, "course": {"id": 102, "name": "Data Structures and Algorithms", "code": "CS201", "credits": 4, "lecturer": "Dr. Michael Chen"}, "status": "enrolled", "final_grade": "B+", "attendance_percentage": 92}
            ],
            "upcoming_assignments": [
                {"id": 1, "title": "HW 1: Variables & Data Types", "course": "Introduction to Programming", "course_code": "CS101", "due_date": "2024-03-10T23:59:00", "max_points": 100, "days_until_due": 2},
                {"id": 2, "title": "Project Proposal", "course": "Data Structures and Algorithms", "course_code": "CS201", "due_date": "2024-03-15T23:59:00", "max_points": 100, "days_until_due": 7}
            ],
            "academic_progress": {"gpa": 3.78, "total_credits": 90, "credits_earned": 90, "completion_percentage": 75},
            "total_courses": 2,
            "completed_assignments": 12,
            "recent_grades": [
                {"assignment_title": "HW 1: Variables & Data Types", "course_name": "Introduction to Programming", "grade": 95, "max_points": 100, "percentage": 95, "graded_date": "2024-03-03"},
                {"assignment_title": "Project Proposal", "course_name": "Data Structures and Algorithms", "grade": 88, "max_points": 100, "percentage": 88, "graded_date": "2024-03-07"}
            ],
            "course_progress": [
                {"course_name": "Introduction to Programming", "progress": 80},
                {"course_name": "Data Structures and Algorithms", "progress": 65}
            ]
        }
    else:
        # Admin mock data matching frontend expectations
        return {
            "total_students": 1172,
            "total_lecturers": 25,
            "total_courses": 42,
            "total_departments": 6,
            "total_programs": 12,
            "current_semester": "Spring 2024",
            "current_enrollments": 950,
            "system_status": "All systems operational",
            # Optionally add more fields if needed by the frontend
        }

# ============================================================================
# MasterLMS Endpoints
# ============================================================================

# Academic Management Endpoints
@app.get("/api/academic/departments")
async def get_departments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        departments = academic_service.get_departments(db)
        return {"departments": departments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get departments: {str(e)}")

@app.post("/api/academic/departments")
async def create_department(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        # Validate input data
        validation_rules = {
            'name': {'type': 'string', 'required': True, 'field_type': 'title'},
            'code': {'type': 'code', 'required': True},
            'description': {'type': 'string', 'required': False, 'field_type': 'description'},
            'head_of_department': {'type': 'string', 'required': False, 'field_type': 'name'}
        }
        validated_data = InputValidator.validate_request_data(request, validation_rules)

        department = academic_service.create_department(db, validated_data)
        return {"message": "Department created successfully", "department": department}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create department: {str(e)}")

@app.put("/api/academic/departments/{department_id}")
async def update_department(
    department_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        department = academic_service.update_department(db, department_id, request)
        return {"message": "Department updated successfully", "department": department}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update department: {str(e)}")

@app.get("/api/academic/departments/{department_id}/can-delete")
async def check_department_deletion(
    department_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        result = academic_service.can_delete_department(db, department_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check department deletion: {str(e)}")

@app.delete("/api/academic/departments/{department_id}")
async def delete_department(
    department_id: int,
    force: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        academic_service.delete_department(db, department_id, force=force)
        return {"message": "Department deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete department: {str(e)}")

@app.get("/api/academic/departments/{department_id}")
async def get_department_details(
    department_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        department = academic_service.get_department_details(db, department_id)
        return {"department": department}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get department details: {str(e)}")

@app.post("/api/academic/departments/{department_id}/assign-lecturer")
async def assign_lecturer_to_department(
    department_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        lecturer_id = request.get("lecturer_id")
        if not lecturer_id:
            raise HTTPException(status_code=400, detail="lecturer_id is required")

        result = academic_service.assign_lecturer_to_department(db, lecturer_id, department_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign lecturer: {str(e)}")

@app.get("/api/academic/programs")
async def get_programs(
    department_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        programs = academic_service.get_programs(db, department_id)
        return {"programs": programs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get programs: {str(e)}")

@app.post("/api/academic/programs")
async def create_program(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        program = academic_service.create_program(db, request)
        return {"message": "Program created successfully", "program": program}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create program: {str(e)}")

@app.put("/api/academic/programs/{program_id}")
async def update_program(
    program_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        program = academic_service.update_program(db, program_id, request)
        return {"message": "Program updated successfully", "program": program}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update program: {str(e)}")

@app.delete("/api/academic/programs/{program_id}")
async def delete_program(
    program_id: int,
    force: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        academic_service.delete_program(db, program_id, force=force)
        return {"message": "Program deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete program: {str(e)}")

@app.get("/api/academic/courses")
async def get_courses(
    semester_id: Optional[int] = None,
    department_id: Optional[int] = None,
    lecturer_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        courses = academic_service.get_courses(db, semester_id, department_id, lecturer_id)
        return {"courses": courses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get courses: {str(e)}")

@app.get("/api/academic/semesters")
async def get_semesters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        semesters = academic_service.get_semesters(db)
        current_semester = academic_service.get_current_semester(db)
        return {"semesters": semesters, "current_semester": current_semester}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get semesters: {str(e)}")

@app.post("/api/academic/semesters")
async def create_semester(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Only allow admins to create semesters
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        # Validate input data
        validation_rules = {
            'name': {'type': 'string', 'required': True, 'field_type': 'title'},
            'semester_type': {'type': 'string', 'required': True, 'field_type': 'short_text'},
            'year': {'type': 'integer', 'required': True, 'min_val': 2020, 'max_val': 2030},
            'start_date': {'type': 'string', 'required': True, 'field_type': 'short_text'},
            'end_date': {'type': 'string', 'required': True, 'field_type': 'short_text'},
            'registration_start': {'type': 'string', 'required': True, 'field_type': 'short_text'},
            'registration_end': {'type': 'string', 'required': True, 'field_type': 'short_text'},
            'is_current': {'type': 'boolean', 'required': False}
        }
        validated_data = InputValidator.validate_request_data(request, validation_rules)

        # Parse dates
        start_date = datetime.fromisoformat(validated_data.get("start_date"))
        end_date = datetime.fromisoformat(validated_data.get("end_date"))
        registration_start = datetime.fromisoformat(validated_data.get("registration_start"))
        registration_end = datetime.fromisoformat(validated_data.get("registration_end"))

        # Create semester
        semester = Semester(
            name=validated_data.get("name"),
            semester_type=SemesterType(validated_data.get("semester_type").lower()),  # Use lowercase for enum
            year=validated_data.get("year"),
            start_date=start_date,
            end_date=end_date,
            registration_start=registration_start,
            registration_end=registration_end,
            is_current=validated_data.get("is_current", False)
        )

        db.add(semester)
        db.commit()
        db.refresh(semester)

        return {
            "message": "Semester created successfully",
            "semester": {
                "id": semester.id,
                "name": semester.name,
                "semester_type": semester.semester_type.value,
                "year": semester.year,
                "start_date": semester.start_date.isoformat(),
                "end_date": semester.end_date.isoformat(),
                "is_current": semester.is_current
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create semester: {str(e)}")

@app.put("/api/academic/semesters/{semester_id}")
async def update_semester(
    semester_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Only allow admins to update semesters
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        semester = db.query(Semester).filter(Semester.id == semester_id).first()
        if not semester:
            raise HTTPException(status_code=404, detail="Semester not found")

        # Update fields
        if "name" in request:
            semester.name = request["name"]
        if "is_current" in request:
            semester.is_current = request["is_current"]

        db.commit()
        return {"message": "Semester updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update semester: {str(e)}")

@app.get("/api/academic/overview")
async def get_academic_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Only allow admins to view system overview
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        overview = academic_service.get_academic_overview(db)
        return overview
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get academic overview: {str(e)}")

# User Management Endpoints
@app.get("/api/users/profile")
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        profile = user_management_service.get_user_profile(db, current_user.id)
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user profile: {str(e)}")

@app.put("/api/users/profile")
async def update_user_profile(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Validate input data
        validation_rules = {
            'name': {'type': 'string', 'required': False, 'field_type': 'name'},
            'email': {'type': 'email', 'required': False},
            'phone': {'type': 'phone', 'required': False},
            'bio': {'type': 'string', 'required': False, 'field_type': 'long_text'},
            'profile_picture_url': {'type': 'string', 'required': False, 'field_type': 'url'}
        }
        validated_data = InputValidator.validate_request_data(request, validation_rules)

        # Users can only update their own profile
        updated_profile = user_management_service.update_user(db, current_user.id, validated_data)
        return updated_profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@app.post("/api/users/change-password")
async def change_password(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        current_password = request.get("current_password")
        new_password = request.get("new_password")

        if not current_password or not new_password:
            raise HTTPException(status_code=400, detail="Current password and new password are required")

        # Verify current password
        if not auth_manager.verify_password(current_password, current_user.password_hash):
            raise HTTPException(status_code=400, detail="Current password is incorrect")

        # Update password
        new_password_hash = auth_manager.hash_password(new_password)
        current_user.password_hash = new_password_hash
        db.commit()

        return {"message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to change password: {str(e)}")

@app.put("/api/users/notification-preferences")
async def update_notification_preferences(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # For now, just return success - in a real app, you'd store these preferences
        return {"message": "Notification preferences updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update notification preferences: {str(e)}")

@app.put("/api/users/privacy-settings")
async def update_privacy_settings(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # For now, just return success - in a real app, you'd store these settings
        return {"message": "Privacy settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update privacy settings: {str(e)}")

@app.get("/api/users/dashboard")
async def get_user_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role == UserRole.STUDENT:
            dashboard = user_management_service.get_student_dashboard(db, current_user.id)
        elif current_user.role == UserRole.LECTURER:
            dashboard = user_management_service.get_lecturer_dashboard(db, current_user.id)
        else:
            # Admin gets academic overview
            dashboard = academic_service.get_academic_overview(db)

        return dashboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard: {str(e)}")

@app.get("/api/users")
async def get_all_users(
    role: Optional[str] = None,
    unassigned: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Only allow admins to view user lists
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        if role and unassigned:
            # Get unassigned lecturers
            if role.lower() == "lecturer":
                users = db.query(User).filter(
                    User.role == UserRole.LECTURER,
                    User.department_id.is_(None),
                    User.is_active == True
                ).all()

                return {"users": [
                    {
                        "id": user.id,
                        "name": user.name,
                        "email": user.email,
                        "role": user.role.value,
                        "employee_id": user.employee_id,
                        "is_active": user.is_active
                    }
                    for user in users
                ]}

        users = user_management_service.get_all_users(db, active_only=True)
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get users: {str(e)}")

@app.get("/api/users/by-role/{role}")
async def get_users_by_role(
    role: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Only allow admins to view user lists
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        try:
            user_role = UserRole(role.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")

        users = user_management_service.get_users_by_role(db, user_role)
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get users: {str(e)}")

@app.post("/api/users")
async def create_user(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Only allow admins to create users
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        # Validate input data
        validation_rules = {
            'name': {'type': 'string', 'required': True, 'field_type': 'name'},
            'email': {'type': 'email', 'required': True},
            'password': {'type': 'string', 'required': True, 'field_type': 'medium_text'},
            'role': {'type': 'string', 'required': True, 'field_type': 'short_text'}
        }
        validated_data = InputValidator.validate_request_data(request, validation_rules)

        name = validated_data.get("name")
        email = validated_data.get("email")
        password = validated_data.get("password")
        role = validated_data.get("role")

        try:
            user_role = UserRole(role.lower())
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid role")

        user = auth_manager.create_user(db, name, email, password, user_role)
        return {
            "message": "User created successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role.value,
                "created_at": user.created_at.isoformat()
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

@app.put("/api/users/{user_id}")
async def update_user(
    user_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Only allow admins to update users
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        # Validate input data
        validation_rules = {
            'name': {'type': 'string', 'required': False, 'field_type': 'name'},
            'email': {'type': 'email', 'required': False},
            'role': {'type': 'string', 'required': False, 'field_type': 'short_text'},
            'phone': {'type': 'phone', 'required': False},
            'bio': {'type': 'string', 'required': False, 'field_type': 'long_text'}
        }
        validated_data = InputValidator.validate_request_data(request, validation_rules)

        user = user_management_service.update_user(db, user_id, validated_data)
        return {"message": "User updated successfully", "user": user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")

@app.get("/api/users/{user_id}")
async def get_user_details(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Only allow admins to get user details
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        user = user_management_service.get_user_by_id(db, user_id)
        return {"user": user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user details: {str(e)}")

@app.put("/api/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Only allow admins to activate users
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        user_management_service.activate_user(db, user_id)
        return {"message": "User activated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to activate user: {str(e)}")

@app.put("/api/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Only allow admins to deactivate users
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        user_management_service.deactivate_user(db, user_id)
        return {"message": "User deactivated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to deactivate user: {str(e)}")

@app.delete("/api/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Only allow admins to delete users
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        user_management_service.delete_user(db, user_id)
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

# ============================================================================
# Enrollment Management API Endpoints
# ============================================================================

@app.get("/api/enrollments")
async def get_all_enrollments():
    return {"enrollments": MOCK_ENROLLMENTS}

@app.post("/api/enrollments")
async def create_enrollment(request: dict):
    new_enrollment = {"id": len(MOCK_ENROLLMENTS)+1, **request}
    MOCK_ENROLLMENTS.append(new_enrollment)
    return {"enrollment": new_enrollment, "message": "Enrollment created successfully"}

@app.put("/api/enrollments/{enrollment_id}")
async def update_enrollment(
    enrollment_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Only allow admins to update enrollments
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")

        # Update status if provided
        if "status" in request:
            try:
                status_value = request["status"].lower()  # Use lowercase for enum
                enrollment.status = EnrollmentStatus(status_value)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid enrollment status: {request['status']}")

        # Update grade if provided
        if "final_grade" in request:
            enrollment.final_grade = request["final_grade"]

        db.commit()
        return {"message": "Enrollment updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update enrollment: {str(e)}")

@app.get("/api/submissions/{submission_id}")
async def get_submission(submission_id: int):
    for sub in MOCK_SUBMISSIONS:
        if sub["id"] == submission_id:
            return {"submission": sub}
    raise HTTPException(status_code=404, detail="Submission not found")

@app.post("/api/submissions")
async def create_submission(request: dict):
    new_submission = {"id": len(MOCK_SUBMISSIONS)+1, **request}
    MOCK_SUBMISSIONS.append(new_submission)
    return {"submission": new_submission, "message": "Submission created successfully"}

@app.get("/api/quizzes/{quiz_id}")
async def get_quiz(quiz_id: int):
    for quiz in MOCK_QUIZZES:
        if quiz["id"] == quiz_id:
            return {"quiz": quiz}
    raise HTTPException(status_code=404, detail="Quiz not found")

@app.post("/api/quizzes")
async def create_quiz(request: dict):
    new_quiz = {"id": len(MOCK_QUIZZES)+1, **request}
    MOCK_QUIZZES.append(new_quiz)
    return {"quiz": new_quiz, "message": "Quiz created successfully"}

@app.get("/api/forums/{forum_id}")
async def get_forum(forum_id: int):
    for forum in MOCK_FORUMS:
        if forum["id"] == forum_id:
            return {"forum": forum}
    raise HTTPException(status_code=404, detail="Forum not found")

@app.post("/api/forums")
async def create_forum(request: dict):
    new_forum = {"id": len(MOCK_FORUMS)+1, **request}
    MOCK_FORUMS.append(new_forum)
    return {"forum": new_forum, "message": "Forum created successfully"}

@app.get("/api/messages/{message_id}")
async def get_message(message_id: int):
    for msg in MOCK_MESSAGES:
        if msg["id"] == message_id:
            return {"message": msg}
    raise HTTPException(status_code=404, detail="Message not found")

@app.post("/api/messages")
async def create_message(request: dict):
    new_message = {"id": len(MOCK_MESSAGES)+1, **request}
    MOCK_MESSAGES.append(new_message)
    return {"message": new_message, "message": "Message sent successfully"}

@app.get("/api/notifications/{notification_id}")
async def get_notification(notification_id: int):
    for notif in MOCK_NOTIFICATIONS:
        if notif["id"] == notification_id:
            return {"notification": notif}
    raise HTTPException(status_code=404, detail="Notification not found")

@app.put("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: int):
    for notif in MOCK_NOTIFICATIONS:
        if notif["id"] == notification_id:
            notif["read"] = True
            return {"notification": notif, "message": "Notification marked as read"}
    raise HTTPException(status_code=404, detail="Notification not found")

# Student-specific endpoints
@app.get("/api/student/enrollments")
async def get_student_enrollments():
    return {"enrollments": MOCK_ENROLLMENTS}

@app.post("/api/student/enroll")
async def enroll_in_course(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != UserRole.STUDENT:
            raise HTTPException(status_code=403, detail="Access denied")

        course_id = request.get("course_id")
        program_id = request.get("program_id")

        if not course_id or not program_id:
            raise HTTPException(status_code=400, detail="course_id and program_id are required")

        result = academic_service.enroll_student(db, current_user.id, course_id, program_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to enroll: {str(e)}")

# Lecturer-specific endpoints
@app.get("/api/lecturer/courses")
async def get_lecturer_courses():
    return {"courses": MOCK_COURSES}

@app.get("/api/lecturer/students")
async def get_lecturer_students():
    """
    Demo endpoint for lecturer students - returns mock data
    """
    import datetime
    
    now = datetime.datetime.now().isoformat()
    return {
        "students": [
            {
                "id": 101,
                "name": "Alice Johnson",
                "email": "alice.johnson@student.edu",
                "student_id": "STU2024001",
                "program": "Computer Science",
                "year": 2,
                "gpa": 3.8,
                "enrollment_date": "2023-09-01T00:00:00",
                "status": "active",
                "courses_enrolled": 5,
                "assignments_completed": 12,
                "last_activity": now
            },
            {
                "id": 102,
                "name": "Bob Smith",
                "email": "bob.smith@student.edu",
                "student_id": "STU2024002",
                "program": "Computer Science",
                "year": 3,
                "gpa": 3.5,
                "enrollment_date": "2022-09-01T00:00:00",
                "status": "active",
                "courses_enrolled": 4,
                "assignments_completed": 8,
                "last_activity": now
            },
            {
                "id": 103,
                "name": "Carol Davis",
                "email": "carol.davis@student.edu",
                "student_id": "STU2024003",
                "program": "Computer Science",
                "year": 1,
                "gpa": 3.9,
                "enrollment_date": "2024-09-01T00:00:00",
                "status": "active",
                "courses_enrolled": 3,
                "assignments_completed": 6,
                "last_activity": now
            },
            {
                "id": 104,
                "name": "David Wilson",
                "email": "david.wilson@student.edu",
                "student_id": "STU2024004",
                "program": "Computer Science",
                "year": 4,
                "gpa": 3.7,
                "enrollment_date": "2021-09-01T00:00:00",
                "status": "active",
                "courses_enrolled": 6,
                "assignments_completed": 15,
                "last_activity": now
            },
            {
                "id": 105,
                "name": "Eva Brown",
                "email": "eva.brown@student.edu",
                "student_id": "STU2024005",
                "program": "Computer Science",
                "year": 2,
                "gpa": 3.6,
                "enrollment_date": "2023-09-01T00:00:00",
                "status": "active",
                "courses_enrolled": 5,
                "assignments_completed": 10,
                "last_activity": now
            }
        ]
    }

@app.get("/api/lecturer/programs")
async def get_lecturer_programs():
    """
    Demo endpoint for lecturer programs - returns mock data
    """
    import datetime
    
    now = datetime.datetime.now().isoformat()
    return {
        "programs": [
            {
                "id": 1,
                "name": "Bachelor of Computer Science",
                "code": "BSCS",
                "description": "A comprehensive program covering computer science fundamentals, programming, algorithms, and software engineering.",
                "department": "Computer Science",
                "duration_years": 4,
                "total_credits": 120,
                "student_count": 45,
                "created_at": "2020-09-01T00:00:00",
                "assignment_role": "coordinator",
                "assigned_at": "2023-01-15T00:00:00",
                "courses": [
                    {
                        "id": 101,
                        "name": "Introduction to Programming",
                        "code": "CS101",
                        "credits": 3,
                        "is_required": True,
                        "semester_order": 1,
                        "lecturer_name": "Dr. Sarah Johnson"
                    },
                    {
                        "id": 102,
                        "name": "Data Structures and Algorithms",
                        "code": "CS201",
                        "credits": 4,
                        "is_required": True,
                        "semester_order": 2,
                        "lecturer_name": "Dr. Michael Chen"
                    },
                    {
                        "id": 103,
                        "name": "Database Systems",
                        "code": "CS301",
                        "credits": 3,
                        "is_required": True,
                        "semester_order": 3,
                        "lecturer_name": "Dr. Emily Davis"
                    },
                    {
                        "id": 104,
                        "name": "Software Engineering",
                        "code": "CS401",
                        "credits": 4,
                        "is_required": True,
                        "semester_order": 4,
                        "lecturer_name": "Dr. Robert Wilson"
                    },
                    {
                        "id": 105,
                        "name": "Computer Networks",
                        "code": "CS302",
                        "credits": 3,
                        "is_required": False,
                        "semester_order": 3,
                        "lecturer_name": "Dr. Lisa Thompson"
                    }
                ]
            },
            {
                "id": 2,
                "name": "Master of Computer Science",
                "code": "MSCS",
                "description": "Advanced program focusing on research, advanced algorithms, and specialized computer science topics.",
                "department": "Computer Science",
                "duration_years": 2,
                "total_credits": 60,
                "student_count": 18,
                "created_at": "2021-09-01T00:00:00",
                "assignment_role": "advisor",
                "assigned_at": "2023-06-01T00:00:00",
                "courses": [
                    {
                        "id": 201,
                        "name": "Advanced Algorithms",
                        "code": "CS501",
                        "credits": 4,
                        "is_required": True,
                        "semester_order": 1,
                        "lecturer_name": "Dr. James Anderson"
                    },
                    {
                        "id": 202,
                        "name": "Machine Learning",
                        "code": "CS502",
                        "credits": 4,
                        "is_required": True,
                        "semester_order": 1,
                        "lecturer_name": "Dr. Maria Garcia"
                    },
                    {
                        "id": 203,
                        "name": "Research Methods",
                        "code": "CS503",
                        "credits": 3,
                        "is_required": True,
                        "semester_order": 2,
                        "lecturer_name": "Dr. Thomas Lee"
                    }
                ]
            }
        ]
    }

# ============================================================================
# Course Management API Endpoints
# ============================================================================

@app.post("/api/courses")
async def create_course(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise HTTPException(status_code=403, detail="Access denied")

        # Validate input data
        validation_rules = {
            'name': {'type': 'string', 'required': True, 'field_type': 'title'},
            'code': {'type': 'code', 'required': True},
            'description': {'type': 'string', 'required': False, 'field_type': 'description'},
            'credits': {'type': 'integer', 'required': False, 'min_val': 1, 'max_val': 10},
            'department_id': {'type': 'integer', 'required': True, 'min_val': 1},
            'max_capacity': {'type': 'integer', 'required': False, 'min_val': 1, 'max_val': 500},
            'prerequisites': {'type': 'string', 'required': False, 'field_type': 'medium_text'},
            'syllabus': {'type': 'string', 'required': False, 'field_type': 'long_text'}
        }
        validated_data = InputValidator.validate_request_data(request, validation_rules)

        # Check if course code already exists (only among active courses)
        existing_course = db.query(Course).filter(
            Course.code == validated_data.get("code").upper(),
            Course.is_active == True
        ).first()
        if existing_course:
            raise HTTPException(
                status_code=400,
                detail=f"Course code '{validated_data.get('code').upper()}' already exists in active courses"
            )

        # Get current semester if not specified
        current_semester = academic_service.get_current_semester(db)

        course = Course(
            name=validated_data.get("name"),
            code=validated_data.get("code"),
            description=validated_data.get("description", ""),
            credits=validated_data.get("credits", 3),
            department_id=validated_data.get("department_id"),
            semester_id=request.get("semester_id", current_semester["id"]),
            lecturer_id=current_user.id if current_user.role == UserRole.LECTURER else request.get("lecturer_id"),
            max_capacity=validated_data.get("max_capacity", 30),
            prerequisites=validated_data.get("prerequisites", ""),
            syllabus=validated_data.get("syllabus", "")
        )

        db.add(course)
        db.commit()
        db.refresh(course)

        return {
            "message": "Course created successfully",
            "course": {
                "id": course.id,
                "name": course.name,
                "code": course.code,
                "description": course.description,
                "credits": course.credits,
                "department_id": course.department_id,
                "lecturer_id": course.lecturer_id,
                "max_capacity": course.max_capacity
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create course: {str(e)}")

@app.put("/api/courses/{course_id}")
async def update_course(
    course_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Check permissions
        if current_user.role == UserRole.LECTURER and course.lecturer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        elif current_user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise HTTPException(status_code=403, detail="Access denied")

        # Update course fields with proper type conversion
        allowed_fields = {
            'name': str,
            'code': str,
            'description': str,
            'credits': int,
            'department_id': int,
            'semester_id': int,
            'lecturer_id': int,
            'max_capacity': int,
            'prerequisites': str,
            'syllabus': str,
            'is_active': bool
        }

        for field, value in request.items():
            if field in allowed_fields and hasattr(course, field):
                try:
                    # Convert value to proper type
                    if allowed_fields[field] == int:
                        converted_value = int(value) if value is not None else None
                    elif allowed_fields[field] == bool:
                        converted_value = bool(value) if value is not None else None
                    else:
                        converted_value = str(value) if value is not None else None
                    
                    setattr(course, field, converted_value)
                except (ValueError, TypeError) as e:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Invalid value for field '{field}': {str(e)}"
                    )

        db.commit()
        return {"message": "Course updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update course: {str(e)}")

@app.delete("/api/courses/{course_id}")
async def delete_course(
    course_id: int,
    force: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        if force:
            # Force delete: deactivate all enrollments, assignments, materials, etc.
            enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
            for enrollment in enrollments:
                enrollment.status = EnrollmentStatus.DROPPED
                enrollment.is_active = False

        course.is_active = False
        db.commit()
        return {"message": "Course deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete course: {str(e)}")

# ============================================================================
# Assignment Management API Endpoints
# ============================================================================

@app.get("/api/courses")
async def get_courses_demo():
    """
    Demo endpoint for courses - returns mock data
    """
    return [
        {"id": "1", "code": "CS101", "name": "Introduction to Computer Science"},
        {"id": "2", "code": "MATH201", "name": "Advanced Mathematics"},
        {"id": "3", "code": "ENG101", "name": "English Composition"},
        {"id": "4", "code": "PHYS101", "name": "Physics Fundamentals"},
        {"id": "5", "code": "CHEM101", "name": "Chemistry Basics"}
    ]

@app.get("/api/assignments")
async def get_assignments(
    course_id: Optional[int] = None,
    role: str = Query("admin")
):
    """
    Portfolio/demo mode: Always return mock assignments for admin, lecturer, and student roles.
    """
    import datetime
    
    # Mock assignments data
    def mock_assignments(role):
        now = datetime.datetime.now().isoformat()
        if role == "admin":
            return [
                {
                    "id": 1,
                    "title": "Admin Assignment 1",
                    "description": "Review all course assignments.",
                    "course_id": 101,
                    "course_name": "All Courses",
                    "course_code": "ALL-ADMIN",
                    "due_date": now,
                    "max_points": 100,
                    "assignment_type": "review",
                    "is_published": True,
                    "submission_count": 10,
                    "graded_count": 8
                },
                {
                    "id": 2,
                    "title": "Admin Assignment 2",
                    "description": "Audit assignment submissions.",
                    "course_id": 102,
                    "course_name": "Audit Course",
                    "course_code": "AUD-ADMIN",
                    "due_date": now,
                    "max_points": 50,
                    "assignment_type": "audit",
                    "is_published": True,
                    "submission_count": 5,
                    "graded_count": 5
                }
            ]
        elif role == "lecturer":
            return [
                {
                    "id": 3,
                    "title": "Lecturer Assignment 1",
                    "description": "Grade student projects.",
                    "course_id": 201,
                    "course_name": "Software Engineering",
                    "course_code": "SE-101",
                    "due_date": now,
                    "max_points": 100,
                    "assignment_type": "project",
                    "is_published": True,
                    "submission_count": 20,
                    "graded_count": 15
                }
            ]
        else:  # student
            return [
                {
                    "id": 4,
                    "title": "Student Assignment 1",
                    "description": "Submit your essay.",
                    "course_id": 301,
                    "course_name": "English Literature",
                    "course_code": "ENG-201",
                    "due_date": now,
                    "max_points": 20,
                    "assignment_type": "essay",
                    "is_published": True,
                    "submission_count": 1,
                    "graded_count": 0
                }
            ]
    
    assignments = mock_assignments(role)
    return {"assignments": assignments}

@app.post("/api/assignments")
async def create_assignment(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise HTTPException(status_code=403, detail="Access denied")

        # Validate input data
        validation_rules = {
            'title': {'type': 'string', 'required': True, 'field_type': 'title'},
            'description': {'type': 'string', 'required': False, 'field_type': 'description'},
            'instructions': {'type': 'string', 'required': False, 'field_type': 'long_text'},
            'course_id': {'type': 'integer', 'required': True, 'min_val': 1},
            'max_points': {'type': 'integer', 'required': False, 'min_val': 1, 'max_val': 1000},
            'assignment_type': {'type': 'string', 'required': False, 'field_type': 'short_text'}
        }
        validated_data = InputValidator.validate_request_data(request, validation_rules)

        # Parse due_date properly
        due_date_str = request.get("due_date")
        if isinstance(due_date_str, str):
            # Handle different datetime formats
            try:
                if due_date_str.endswith('Z'):
                    due_date_str = due_date_str[:-1] + '+00:00'
                due_date = datetime.fromisoformat(due_date_str)
            except ValueError:
                # Fallback: try to parse common formats
                try:
                    due_date = datetime.strptime(due_date_str, "%Y-%m-%dT%H:%M:%S")
                except ValueError:
                    # Last resort: use current time + 1 week
                    due_date = datetime.now(timezone.utc) + timedelta(days=7)
        else:
            due_date = due_date_str

        assignment = Assignment(
            title=validated_data.get("title"),
            description=validated_data.get("description", ""),
            course_id=validated_data.get("course_id"),
            due_date=due_date,
            max_points=validated_data.get("max_points", 100),
            assignment_type=validated_data.get("assignment_type", "homework"),
            instructions=validated_data.get("instructions", ""),
            is_published=request.get("is_published", True)
        )

        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        return {"message": "Assignment created successfully", "assignment_id": assignment.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create assignment: {str(e)}")

@app.get("/api/assignments/{assignment_id}/submissions")
async def get_assignment_submissions_demo(assignment_id: int):
    """
    Demo endpoint for assignment submissions - returns mock data
    """
    import datetime
    
    now = datetime.datetime.now().isoformat()
    return [
        {
            "id": 1,
            "student_id": 101,
            "student_name": "John Doe",
            "student_email": "john.doe@example.com",
            "submitted_at": now,
            "grade": 85,
            "feedback": "Good work, but could improve on citations.",
            "is_late": False,
            "file_url": "/uploads/submissions/assignment1_john_doe.pdf"
        },
        {
            "id": 2,
            "student_id": 102,
            "student_name": "Jane Smith",
            "student_email": "jane.smith@example.com",
            "submitted_at": now,
            "grade": 92,
            "feedback": "Excellent work! Very thorough analysis.",
            "is_late": False,
            "file_url": "/uploads/submissions/assignment1_jane_smith.pdf"
        },
        {
            "id": 3,
            "student_id": 103,
            "student_name": "Mike Johnson",
            "student_email": "mike.johnson@example.com",
            "submitted_at": now,
            "grade": None,
            "feedback": None,
            "is_late": True,
            "file_url": "/uploads/submissions/assignment1_mike_johnson.pdf"
        }
    ]

@app.put("/api/submissions/{submission_id}/grade")
async def grade_submission_demo(submission_id: int, request: dict):
    """
    Demo endpoint for grading submissions - always returns success
    """
    return {"message": "Submission graded successfully"}

# ============================================================================
# File Upload System for Course Materials
# ============================================================================

@app.post("/api/courses/{course_id}/materials")
async def upload_course_material(
    course_id: int,
    file: UploadFile = File(...),
    title: str = "",
    description: str = "",
    material_type: str = "document",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Check permissions
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        if current_user.role == UserRole.LECTURER and course.lecturer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        elif current_user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise HTTPException(status_code=403, detail="Access denied")

        # Validate file type and size
        allowed_video_types = ["video/mp4", "video/avi", "video/mov", "video/mkv", "video/webm", "video/flv", "video/wmv"]
        allowed_document_types = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
                                 "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                                 "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                 "image/jpeg", "image/png", "image/gif"]
        
        is_video = file.content_type in allowed_video_types
        is_document = file.content_type in allowed_document_types
        
        if not (is_video or is_document):
            raise HTTPException(status_code=400, detail="Unsupported file type")

        # Check file size (1GB for videos, 50MB for documents)
        max_size = 1024 * 1024 * 1024 if is_video else 50 * 1024 * 1024  # 1GB for videos, 50MB for documents
        
        # Read file content to check size
        content = await file.read()
        if len(content) > max_size:
            raise HTTPException(status_code=400, detail=f"File too large. Maximum size: {max_size // (1024*1024)}MB")

        # Determine upload directory based on file type
        if is_video:
            upload_dir = "uploads/videos"
            material_type = "video"
        else:
            upload_dir = "uploads/course_materials"
            material_type = "document"

        # Create uploads directory if it doesn't exist
        os.makedirs(upload_dir, exist_ok=True)

        # Generate unique filename with timestamp
        file_extension = os.path.splitext(file.filename)[1]
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"{course_id}_{timestamp}_{file.filename}"
        file_path = os.path.join(upload_dir, unique_filename)

        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        # Create database record
        material = CourseMaterial(
            course_id=course_id,
            title=title or file.filename,
            description=description,
            file_name=file.filename,
            file_path=file_path,
            file_size=len(content),
            file_type=file.content_type,
            material_type=material_type,
            uploaded_by_id=current_user.id
        )

        db.add(material)
        db.commit()
        db.refresh(material)

        # Log successful upload
        logger.info(f"Course material uploaded: {material.id} - {file.filename} by user {current_user.id}")

        return {
            "message": "Course material uploaded successfully",
            "material_id": material.id,
            "file_name": material.file_name,
            "file_size": material.file_size,
            "material_type": material.material_type,
            "file_type": material.file_type
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload course material: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to upload course material: {str(e)}")

@app.get("/api/courses/{course_id}/materials")
async def get_course_materials(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Check if user has access to course
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Check enrollment or teaching access
        has_access = False
        if current_user.role == UserRole.ADMIN:
            has_access = True
        elif current_user.role == UserRole.LECTURER and course.lecturer_id == current_user.id:
            has_access = True
        elif current_user.role == UserRole.STUDENT:
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == course_id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            ).first()
            has_access = enrollment is not None

        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")

        materials = db.query(CourseMaterial).filter(
            CourseMaterial.course_id == course_id,
            CourseMaterial.is_active == True
        ).order_by(CourseMaterial.created_at.desc()).all()

        material_list = []
        for material in materials:
            # Create file URL for access - use streaming for videos, download for others
            if material.material_type == "video":
                file_url = f"/api/materials/{material.id}/stream"
            else:
                file_url = f"/api/materials/{material.id}/download"
            
            material_list.append({
                "id": material.id,
                "title": material.title,
                "description": material.description,
                "material_type": material.material_type,
                "file_url": file_url,
                "thumbnail_url": None,  # Can be added later if thumbnail support is implemented
                "duration": None,  # Can be added later if video duration extraction is implemented
                "file_name": material.file_name,
                "file_size": material.file_size,
                "file_type": material.file_type,
                "uploaded_at": material.created_at.isoformat(),
                "uploaded_by": material.uploaded_by.name if material.uploaded_by else "Unknown"
            })

        return {
            "id": course.id,
            "name": course.name,
            "code": course.code,
            "description": course.description,
            "lecturer": course.lecturer.name if course.lecturer else "Unknown",
            "materials": material_list
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get course materials: {str(e)}")

@app.get("/api/materials/{material_id}/download")
async def download_course_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        material = db.query(CourseMaterial).filter(CourseMaterial.id == material_id).first()
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")

        # Check access permissions (same as get_course_materials)
        course = material.course
        has_access = False
        if current_user.role == UserRole.ADMIN:
            has_access = True
        elif current_user.role == UserRole.LECTURER and course.lecturer_id == current_user.id:
            has_access = True
        elif current_user.role == UserRole.STUDENT:
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == course.id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            ).first()
            has_access = enrollment is not None

        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")

        # Return file download response
        from fastapi.responses import FileResponse
        return FileResponse(
            path=material.file_path,
            filename=material.file_name,
            media_type=material.file_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download material: {str(e)}")

@app.delete("/api/materials/{material_id}")
async def delete_course_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        material = db.query(CourseMaterial).filter(CourseMaterial.id == material_id).first()
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")

        # Check permissions
        course = material.course
        if current_user.role == UserRole.LECTURER and course.lecturer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        elif current_user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise HTTPException(status_code=403, detail="Access denied")

        # Delete file from filesystem
        if material.file_path and os.path.exists(material.file_path):
            os.remove(material.file_path)

        # Delete from database
        db.delete(material)
        db.commit()

        return {"message": "Material deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete material: {str(e)}")

@app.get("/api/courses/{course_id}/students")
async def get_course_students(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Check permissions
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        if current_user.role == UserRole.LECTURER and course.lecturer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        elif current_user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise HTTPException(status_code=403, detail="Access denied")

        # Get enrolled students
        enrollments = db.query(Enrollment).filter(
            Enrollment.course_id == course_id,
            Enrollment.status == EnrollmentStatus.ENROLLED
        ).all()

        students = []
        for enrollment in enrollments:
            student = enrollment.student
            students.append({
                "id": student.id,
                "student_id": student.student_id,
                "name": student.name,
                "email": student.email,
                "enrollment_date": enrollment.enrollment_date.isoformat() if enrollment.enrollment_date else None,
                "current_grade": enrollment.final_grade,
                "attendance_rate": enrollment.attendance_percentage or 85.5,  # Use actual or mock data
                "last_activity": "2024-01-15T10:30:00"  # Mock data
            })

        return {"students": students}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get course students: {str(e)}")

@app.get("/api/courses/{course_id}/analytics")
async def get_course_analytics(
    course_id: int,
    timeRange: str = "month",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Check permissions
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        if current_user.role == UserRole.LECTURER and course.lecturer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        elif current_user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise HTTPException(status_code=403, detail="Access denied")

        # Get course statistics
        enrollments = db.query(Enrollment).filter(
            Enrollment.course_id == course_id,
            Enrollment.status == EnrollmentStatus.ENROLLED
        ).count()

        assignments = db.query(Assignment).filter(Assignment.course_id == course_id).all()
        quizzes = db.query(Quiz).filter(Quiz.course_id == course_id).all()

        # Calculate average grade (mock calculation)
        avg_grade = 82.5
        completion_rate = 78.5

        # Mock analytics data
        analytics_data = {
            "course_performance": [{
                "course_id": course_id,
                "course_name": course.name,
                "course_code": course.code,
                "total_students": enrollments,
                "average_grade": avg_grade,
                "completion_rate": completion_rate,
                "assignment_count": len(assignments),
                "quiz_count": len(quizzes)
            }],
            "student_engagement": [
                {"date": "2024-01-01", "active_students": 35, "submissions": 28, "quiz_attempts": 42},
                {"date": "2024-01-02", "active_students": 38, "submissions": 31, "quiz_attempts": 45},
                {"date": "2024-01-03", "active_students": 42, "submissions": 35, "quiz_attempts": 48},
                {"date": "2024-01-04", "active_students": 40, "submissions": 33, "quiz_attempts": 46},
                {"date": "2024-01-05", "active_students": 44, "submissions": 37, "quiz_attempts": 50}
            ],
            "grade_distribution": [
                {"grade_range": "A (90-100)", "count": 12},
                {"grade_range": "B (80-89)", "count": 18},
                {"grade_range": "C (70-79)", "count": 10},
                {"grade_range": "D (60-69)", "count": 4},
                {"grade_range": "F (0-59)", "count": 1}
            ],
            "assignment_performance": [
                {"assignment_name": assignment.title, "average_score": 85.2, "submission_rate": 95.5}
                for assignment in assignments[:4]  # Show first 4 assignments
            ]
        }

        return analytics_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get course analytics: {str(e)}")

# ============================================================================
# Lesson Management Endpoints
# ============================================================================

@app.post("/api/courses/{course_id}/lessons")
async def create_lesson(
    course_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Check permissions
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        if current_user.role == UserRole.LECTURER and course.lecturer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        elif current_user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise HTTPException(status_code=403, detail="Access denied")

        # Parse lesson_date if provided
        lesson_date = None
        if request.get("lesson_date"):
            from datetime import datetime
            lesson_date = datetime.fromisoformat(request["lesson_date"])

        # Create lesson
        lesson = Lesson(
            course_id=course_id,
            title=request["title"],
            description=request["description"],
            lesson_date=lesson_date,
            lesson_time=request.get("lesson_time"),
            duration_minutes=request.get("duration_minutes", 60),
            lesson_type=request.get("lesson_type", "lecture"),
            created_by_id=current_user.id
        )

        db.add(lesson)
        db.commit()
        db.refresh(lesson)

        return {
            "message": "Lesson created successfully",
            "lesson_id": lesson.id,
            "title": lesson.title
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create lesson: {str(e)}")

@app.get("/api/courses/{course_id}/lessons")
async def get_course_lessons(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Check if user has access to course
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Check enrollment or teaching access
        has_access = False
        if current_user.role == UserRole.ADMIN:
            has_access = True
        elif current_user.role == UserRole.LECTURER and course.lecturer_id == current_user.id:
            has_access = True
        elif current_user.role == UserRole.STUDENT:
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == course_id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            ).first()
            has_access = enrollment is not None

        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")

        lessons = db.query(Lesson).filter(
            Lesson.course_id == course_id
        ).order_by(Lesson.lesson_order, Lesson.created_at).all()

        lesson_list = []
        for lesson in lessons:
            # Get lesson materials
            materials = db.query(CourseMaterial).filter(
                CourseMaterial.lesson_id == lesson.id,
                CourseMaterial.is_active == True
            ).all()

            material_list = []
            for material in materials:
                material_list.append({
                    "id": material.id,
                    "title": material.title,
                    "file_name": material.file_name,
                    "file_type": material.file_type,
                    "file_size": material.file_size
                })

            lesson_list.append({
                "id": lesson.id,
                "title": lesson.title,
                "description": lesson.description,
                "lesson_date": lesson.lesson_date.isoformat() if lesson.lesson_date else None,
                "lesson_time": lesson.lesson_time,
                "duration_minutes": lesson.duration_minutes,
                "lesson_type": lesson.lesson_type,
                "is_published": lesson.is_published,
                "materials": material_list
            })

        return {"lessons": lesson_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get course lessons: {str(e)}")

@app.put("/api/lessons/{lesson_id}")
async def update_lesson(
    lesson_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        # Check permissions
        if current_user.role == UserRole.LECTURER and lesson.course.lecturer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        elif current_user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise HTTPException(status_code=403, detail="Access denied")

        # Update lesson fields
        for field, value in request.items():
            if field == "lesson_date" and value:
                from datetime import datetime
                lesson.lesson_date = datetime.fromisoformat(value)
            elif hasattr(lesson, field):
                setattr(lesson, field, value)

        db.commit()
        return {"message": "Lesson updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update lesson: {str(e)}")

@app.delete("/api/lessons/{lesson_id}")
async def delete_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        # Check permissions
        if current_user.role == UserRole.LECTURER and lesson.course.lecturer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        elif current_user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise HTTPException(status_code=403, detail="Access denied")

        db.delete(lesson)
        db.commit()
        return {"message": "Lesson deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete lesson: {str(e)}")

@app.post("/api/lessons/{lesson_id}/complete")
async def mark_lesson_complete(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != UserRole.STUDENT:
            raise HTTPException(status_code=403, detail="Access denied")

        lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")

        # Check if student is enrolled in the course
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == lesson.course_id,
            Enrollment.status == EnrollmentStatus.ENROLLED
        ).first()

        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this course")

        # For now, just return success - in a full implementation,
        # you'd track lesson completion in a separate table
        return {"message": "Lesson marked as complete"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark lesson complete: {str(e)}")

# ============================================================================
# Assignment Submission File Upload
# ============================================================================

@app.post("/api/assignments/{assignment_id}/submit")
async def submit_assignment(
    assignment_id: int,
    file: UploadFile = File(...),
    comments: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != UserRole.STUDENT:
            raise HTTPException(status_code=403, detail="Only students can submit assignments")

        assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

        # Check if student is enrolled in the course
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.course_id == assignment.course_id,
            Enrollment.status == EnrollmentStatus.ENROLLED
        ).first()

        if not enrollment:
            raise HTTPException(status_code=403, detail="Not enrolled in this course")

        # Check if assignment is still accepting submissions
        if not assignment.is_published:
            raise HTTPException(status_code=400, detail="Assignment is not published")

        # Create uploads directory
        upload_dir = "uploads/assignments"
        os.makedirs(upload_dir, exist_ok=True)

        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{assignment_id}_{current_user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
        file_path = os.path.join(upload_dir, unique_filename)

        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Check if submission already exists
        existing_submission = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == current_user.id
        ).first()

        if existing_submission:
            # Update existing submission
            existing_submission.file_path = file_path
            existing_submission.file_name = file.filename
            existing_submission.comments = comments
            existing_submission.submitted_at = datetime.now(timezone.utc)
            existing_submission.is_late = datetime.now(timezone.utc) > assignment.due_date
            submission = existing_submission
        else:
            # Create new submission
            submission = AssignmentSubmission(
                assignment_id=assignment_id,
                student_id=current_user.id,
                file_path=file_path,
                file_name=file.filename,
                comments=comments,
                is_late=datetime.now(timezone.utc) > assignment.due_date
            )
            db.add(submission)

        db.commit()
        db.refresh(submission)

        return {
            "message": "Assignment submitted successfully",
            "submission_id": submission.id,
            "is_late": submission.is_late,
            "submitted_at": submission.submitted_at.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit assignment: {str(e)}")

@app.get("/api/submissions/{submission_id}/download")
async def download_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        submission = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
        if not submission:
            raise HTTPException(status_code=404, detail="Submission not found")

        # Check permissions
        has_access = False
        if current_user.role == UserRole.ADMIN:
            has_access = True
        elif current_user.role == UserRole.LECTURER and submission.assignment.course.lecturer_id == current_user.id:
            has_access = True
        elif current_user.role == UserRole.STUDENT and submission.student_id == current_user.id:
            has_access = True

        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")

        from fastapi.responses import FileResponse
        return FileResponse(
            path=submission.file_path,
            filename=submission.file_name,
            media_type="application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download submission: {str(e)}")

# ============================================================================
# Discussion Forums API Endpoints
# ============================================================================

@app.get("/api/courses/{course_id}/forums")
async def get_course_forums(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        forums = discussion_service.get_course_forums(db, course_id, current_user.id)
        return {"forums": forums}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get forums: {str(e)}")

@app.post("/api/courses/{course_id}/forums")
async def create_forum(
    course_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        title = request.get("title")
        description = request.get("description", "")

        if not title:
            raise HTTPException(status_code=400, detail="Title is required")

        result = discussion_service.create_forum(db, course_id, title, description, current_user.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create forum: {str(e)}")

@app.get("/api/forums/{forum_id}/threads")
async def get_forum_threads(
    forum_id: int,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = discussion_service.get_forum_threads(db, forum_id, current_user.id, page, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get threads: {str(e)}")

@app.post("/api/forums/{forum_id}/threads")
async def create_thread(
    forum_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        title = request.get("title")
        content = request.get("content")

        if not title or not content:
            raise HTTPException(status_code=400, detail="Title and content are required")

        result = discussion_service.create_thread(db, forum_id, title, content, current_user.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create thread: {str(e)}")

@app.get("/api/threads/{thread_id}/posts")
async def get_thread_posts(
    thread_id: int,
    page: int = 1,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = discussion_service.get_thread_posts(db, thread_id, current_user.id, page, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get posts: {str(e)}")

@app.post("/api/threads/{thread_id}/posts")
async def create_post(
    thread_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        content = request.get("content")
        parent_post_id = request.get("parent_post_id")

        if not content:
            raise HTTPException(status_code=400, detail="Content is required")

        result = discussion_service.create_post(db, thread_id, content, current_user.id, parent_post_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create post: {str(e)}")

@app.put("/api/threads/{thread_id}/pin")
async def pin_thread(
    thread_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = discussion_service.pin_thread(db, thread_id, current_user.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to pin thread: {str(e)}")

@app.put("/api/threads/{thread_id}/lock")
async def lock_thread(
    thread_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = discussion_service.lock_thread(db, thread_id, current_user.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to lock thread: {str(e)}")

# ============================================================================
# Quiz Management Endpoints
# ============================================================================

@app.get("/api/lecturer/quizzes")
async def get_lecturer_quizzes():
    """
    Demo endpoint for lecturer quizzes - returns mock data
    """
    import datetime
    
    now = datetime.datetime.now().isoformat()
    return {
        "quizzes": [
            {
                "id": 1,
                "title": "Introduction to Programming Quiz",
                "description": "Basic concepts of programming and algorithms",
                "course_id": 101,
                "course_name": "Introduction to Programming",
                "questions_count": 15,
                "time_limit": 30,
                "max_attempts": 3,
                "is_published": True,
                "created_at": "2024-01-15T00:00:00",
                "attempts_count": 45
            },
            {
                "id": 2,
                "title": "Data Structures Midterm",
                "description": "Comprehensive test on arrays, linked lists, and trees",
                "course_id": 102,
                "course_name": "Data Structures and Algorithms",
                "questions_count": 25,
                "time_limit": 60,
                "max_attempts": 2,
                "is_published": True,
                "created_at": "2024-02-01T00:00:00",
                "attempts_count": 38
            },
            {
                "id": 3,
                "title": "Database Fundamentals",
                "description": "SQL queries, normalization, and database design",
                "course_id": 103,
                "course_name": "Database Systems",
                "questions_count": 20,
                "time_limit": 45,
                "max_attempts": 3,
                "is_published": False,
                "created_at": "2024-02-10T00:00:00",
                "attempts_count": 0
            }
        ]
    }

@app.post("/api/quizzes")
async def create_quiz(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise HTTPException(status_code=403, detail="Access denied")

        quiz = Quiz(
            title=request.get("title"),
            description=request.get("description", ""),
            course_id=request.get("course_id"),
            created_by_id=current_user.id,
            time_limit=request.get("time_limit", 30),
            max_attempts=request.get("max_attempts", 3),
            is_published=request.get("is_published", False)
        )

        db.add(quiz)
        db.commit()
        db.refresh(quiz)

        return {
            "message": "Quiz created successfully",
            "quiz": {
                "id": quiz.id,
                "title": quiz.title,
                "course_id": quiz.course_id
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create quiz: {str(e)}")

@app.get("/api/lecturer/assignments")
async def get_lecturer_assignments():
    return {"assignments": MOCK_ASSIGNMENTS}

# ============================================================================
# Communication System API Endpoints
# ============================================================================

@app.get("/api/announcements")
async def get_announcements():
    """
    Demo endpoint for announcements - returns mock data
    """
    import datetime
    
    now = datetime.datetime.now().isoformat()
    return {
        "announcements": [
            {
                "id": 1,
                "title": "Welcome to EduFlow LMS!",
                "content": "Welcome to our new Learning Management System. We're excited to provide you with an enhanced learning experience.",
                "type": "news",
                "priority": "high",
                "author": "Admin Team",
                "department": "IT Department",
                "target_audience": ["students", "lecturers", "staff"],
                "event_date": None,
                "event_location": None,
                "is_active": True,
                "created_at": now,
                "updated_at": now
            },
            {
                "id": 2,
                "title": "Campus Maintenance Notice",
                "content": "Scheduled maintenance will be performed on the library systems this weekend. Please plan accordingly.",
                "type": "alert",
                "priority": "medium",
                "author": "Facilities Management",
                "department": "Facilities",
                "target_audience": ["students", "staff"],
                "event_date": None,
                "event_location": "Library",
                "is_active": True,
                "created_at": now,
                "updated_at": now
            },
            {
                "id": 3,
                "title": "Academic Excellence Awards Ceremony",
                "content": "Join us for the annual Academic Excellence Awards ceremony to celebrate outstanding student achievements.",
                "type": "event",
                "priority": "high",
                "author": "Academic Affairs",
                "department": "Academic Affairs",
                "target_audience": ["students", "lecturers", "parents"],
                "event_date": "2025-01-15T18:00:00",
                "event_location": "Main Auditorium",
                "is_active": True,
                "created_at": now,
                "updated_at": now
            }
        ]
    }

@app.post("/api/announcements")
async def create_announcement(request: dict):
    """
    Demo endpoint for creating announcements - always returns success
    """
    return {"announcement": {"id": 999, **request}, "message": "Announcement created successfully"}

@app.get("/api/events")
async def get_events():
    """
    Demo endpoint for events - returns mock data
    """
    import datetime
    
    now = datetime.datetime.now().isoformat()
    return {
        "events": [
            {
                "id": 1,
                "title": "Academic Excellence Awards Ceremony",
                "description": "Annual ceremony to celebrate outstanding student achievements and academic excellence.",
                "event_date": "2025-01-15",
                "event_time": "18:00",
                "location": "Main Auditorium",
                "organizer": "Academic Affairs",
                "department": "Academic Affairs",
                "max_attendees": 500,
                "registered_count": 320,
                "is_public": True,
                "status": "upcoming",
                "created_at": now
            },
            {
                "id": 2,
                "title": "Faculty Development Workshop",
                "description": "Workshop on innovative teaching methodologies and modern educational technologies.",
                "event_date": "2025-01-20",
                "event_time": "09:00",
                "location": "Conference Room A",
                "organizer": "Teaching Excellence Center",
                "department": "Academic Development",
                "max_attendees": 50,
                "registered_count": 45,
                "is_public": False,
                "status": "upcoming",
                "created_at": now
            },
            {
                "id": 3,
                "title": "Student Career Fair",
                "description": "Connect with potential employers and explore career opportunities in various industries.",
                "event_date": "2025-02-10",
                "event_time": "10:00",
                "location": "Student Center",
                "organizer": "Career Services",
                "department": "Student Affairs",
                "max_attendees": 300,
                "registered_count": 280,
                "is_public": True,
                "status": "upcoming",
                "created_at": now
            },
            {
                "id": 4,
                "title": "Campus Sports Tournament",
                "description": "Annual inter-department sports tournament featuring basketball, soccer, and volleyball.",
                "event_date": "2025-01-25",
                "event_time": "14:00",
                "location": "Sports Complex",
                "organizer": "Student Activities",
                "department": "Student Affairs",
                "max_attendees": 200,
                "registered_count": 150,
                "is_public": True,
                "status": "upcoming",
                "created_at": now
            }
        ]
    }

@app.post("/api/events")
async def create_event(request: dict):
    """
    Demo endpoint for creating events - always returns success
    """
    return {"event": {"id": 999, **request}, "message": "Event created successfully"}

@app.post("/api/messages")
async def send_message(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        recipient_id = request.get("recipient_id")
        subject = request.get("subject")
        content = request.get("content")
        parent_message_id = request.get("parent_message_id")

        if not recipient_id or not subject or not content:
            raise HTTPException(status_code=400, detail="Recipient, subject, and content are required")

        result = communication_service.send_message(
            db, current_user.id, recipient_id, subject, content, parent_message_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")

@app.get("/api/messages")
async def get_messages(
    message_type: str = "inbox",
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = communication_service.get_user_messages(db, current_user.id, message_type, page, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get messages: {str(e)}")

@app.get("/api/messages/{message_id}/thread")
async def get_message_thread(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = communication_service.get_message_thread(db, message_id, current_user.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get message thread: {str(e)}")

@app.get("/api/notifications")
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        notifications = communication_service.get_user_notifications(db, current_user.id, unread_only, limit)
        return {"notifications": notifications}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get notifications: {str(e)}")

@app.put("/api/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = communication_service.mark_notification_read(db, notification_id, current_user.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark notification as read: {str(e)}")

@app.get("/api/notifications/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = communication_service.get_unread_count(db, current_user.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get unread count: {str(e)}")

# ============================================================================
# Real-time WebSocket Endpoints
# ============================================================================

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    """WebSocket endpoint for real-time communication"""
    try:
        # Get user information
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=4004, reason="User not found")
            return

        # Connect user to WebSocket
        await connection_manager.connect(websocket, user_id, user.role.value)

        # Send connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }))

        # Send initial unread count
        unread_count = communication_service.get_unread_count(db, user_id)
        await websocket.send_text(json.dumps({
            "type": "unread_count",
            "data": unread_count,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }))

        try:
            while True:
                # Wait for messages from client
                data = await websocket.receive_text()
                await realtime_service.handle_websocket_message(websocket, user_id, data)

        except WebSocketDisconnect:
            connection_manager.disconnect(websocket, user_id)
            print(f"User {user_id} disconnected")

    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
        connection_manager.disconnect(websocket, user_id)

@app.get("/api/realtime/stats")
async def get_realtime_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get real-time connection statistics (admin only)"""
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        stats = realtime_service.get_connection_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get realtime stats: {str(e)}")

# ============================================================================
# Student Assessment Endpoints
# ============================================================================

@app.get("/api/student/courses")
async def get_student_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != UserRole.STUDENT:
            raise HTTPException(status_code=403, detail="Access denied")

        # Get courses the student is enrolled in
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id
        ).all()

        courses = []
        for enrollment in enrollments:
            courses.append({
                "id": enrollment.course.id,
                "name": enrollment.course.name,
                "code": enrollment.course.code
            })

        return {"courses": courses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get student courses: {str(e)}")

@app.get("/api/student/enrolled-courses")
async def get_student_enrolled_courses():
    """
    Demo endpoint for student's enrolled courses - returns mock data
    """
    return {
        "courses": [
            {
                "id": 101,
                "name": "Introduction to Programming",
                "code": "CS101",
                "lecturer": "Dr. Sarah Johnson"
            },
            {
                "id": 102,
                "name": "Data Structures and Algorithms",
                "code": "CS201",
                "lecturer": "Dr. Michael Chen"
            },
            {
                "id": 103,
                "name": "Database Systems",
                "code": "CS301",
                "lecturer": "Dr. Emily Davis"
            }
        ]
    }

@app.get("/api/student/academic-record")
async def get_student_academic_record():
    """
    Demo endpoint for student academic record - returns mock data in the structure expected by the frontend, including degree_progress
    """
    return {
        "record": {
            "student_info": {
                "name": "Alice Smith",
                "student_id": "STU2024001",
                "email": "alice.smith@student.edu",
                "program": "Bachelor of Computer Science",
                "department": "Computer Science",
                "admission_date": "2021-09-01",
                "expected_graduation": "2025-05-15",
                "academic_standing": "Good Standing"
            },
            "overall_gpa": 3.78,
            "total_credits_earned": 90,
            "total_credits_attempted": 96,
            "cumulative_gpa": 3.78,
            "degree_progress": {
                "total_credits_required": 120,
                "credits_completed": 90,
                "credits_in_progress": 6,
                "percentage_complete": 75,
                "core_courses": [
                    {"course_code": "CS101", "name": "Intro to Programming", "status": "completed"},
                    {"course_code": "CS201", "name": "Data Structures", "status": "completed"},
                    {"course_code": "CS301", "name": "Database Systems", "status": "completed"},
                    {"course_code": "CS401", "name": "Software Engineering", "status": "in_progress"}
                ],
                "electives": [
                    {"course_code": "MATH201", "name": "Discrete Math", "status": "completed"},
                    {"course_code": "ENG101", "name": "English Composition", "status": "completed"},
                    {"course_code": "PHY101", "name": "Physics I", "status": "not_started"}
                ]
            }
        }
    }

@app.get("/api/student/transcript")
async def get_student_transcript():
    """
    Demo endpoint for student transcript - returns mock data in the structure expected by the frontend
    """
    return {
        "transcript": {
            "semesters": [
                {
                    "semester_id": 1,
                    "semester_name": "Fall",
                    "year": 2021,
                    "semester_gpa": 3.8,
                    "credits_earned": 15,
                    "credits_attempted": 15,
                    "courses": [
                        {
                            "course_code": "CS101",
                            "course_name": "Introduction to Programming",
                            "credits": 3,
                            "grade": "A",
                            "grade_points": 4.0,
                            "instructor": "Dr. Sarah Johnson",
                            "final_percentage": 95
                        },
                        {
                            "course_code": "MATH101",
                            "course_name": "Calculus I",
                            "credits": 4,
                            "grade": "A-",
                            "grade_points": 3.7,
                            "instructor": "Dr. Emily Davis",
                            "final_percentage": 91
                        }
                    ]
                },
                {
                    "semester_id": 2,
                    "semester_name": "Spring",
                    "year": 2022,
                    "semester_gpa": 3.7,
                    "credits_earned": 15,
                    "credits_attempted": 15,
                    "courses": [
                        {
                            "course_code": "CS201",
                            "course_name": "Data Structures and Algorithms",
                            "credits": 4,
                            "grade": "B+",
                            "grade_points": 3.3,
                            "instructor": "Dr. Michael Chen",
                            "final_percentage": 88
                        },
                        {
                            "course_code": "ENG101",
                            "course_name": "English Composition",
                            "credits": 3,
                            "grade": "A",
                            "grade_points": 4.0,
                            "instructor": "Dr. Lisa Thompson",
                            "final_percentage": 94
                        }
                    ]
                }
            ],
            "academic_summary": {
                "cumulative_gpa": 3.78,
                "total_credits": 90,
                "major_gpa": 3.85,
                "academic_standing": "Good Standing",
                "honors": ["Dean's List", "Academic Excellence"]
            }
        }
    }

@app.get("/api/student/quizzes")
async def get_student_quizzes():
    return {
        "quizzes": [
            {
                "id": 1,
                "title": "Quiz 1: Basics",
                "description": "Covers variables and data types.",
                "course_id": 101,
                "course_name": "Introduction to Programming",
                "course_code": "CS101",
                "time_limit": 30,
                "max_attempts": 3,
                "is_published": True,
                "questions_count": 10,
                "my_attempts": 1,
                "best_score": 92,
                "last_attempt_date": "2024-03-05T10:00:00",
                "status": "completed"
            },
            {
                "id": 2,
                "title": "Quiz 2: Control Flow",
                "description": "Covers if/else and loops.",
                "course_id": 101,
                "course_name": "Introduction to Programming",
                "course_code": "CS101",
                "time_limit": 30,
                "max_attempts": 3,
                "is_published": True,
                "questions_count": 10,
                "my_attempts": 0,
                "best_score": None,
                "last_attempt_date": None,
                "status": "available"
            }
        ]
    }

@app.get("/api/student/assignments")
async def get_student_assignments():
    return {
        "assignments": [
            {
                "id": 1,
                "title": "HW 1: Variables & Data Types",
                "description": "Practice with variables and data types.",
                "course_id": 101,
                "course_name": "Introduction to Programming",
                "course_code": "CS101",
                "due_date": "2024-03-10T23:59:00",
                "max_points": 100,
                "assignment_type": "Homework",
                "instructions": "Complete all questions.",
                "is_published": True,
                "my_submission": {
                    "id": 1,
                    "submitted_at": "2024-03-09T20:00:00",
                    "grade": 95,
                    "feedback": "Great job!",
                    "file_path": "/uploads/assignments/hw1.pdf"
                },
                "status": "graded"
            },
            {
                "id": 2,
                "title": "Project Proposal",
                "description": "Submit your project proposal.",
                "course_id": 102,
                "course_name": "Data Structures and Algorithms",
                "course_code": "CS201",
                "due_date": "2024-03-15T23:59:00",
                "max_points": 100,
                "assignment_type": "Project",
                "instructions": "Upload your proposal as a PDF.",
                "is_published": True,
                "my_submission": {
                    "id": 2,
                    "submitted_at": "2024-03-14T18:00:00",
                    "grade": 88,
                    "feedback": "Well done.",
                    "file_path": "/uploads/assignments/proposal.pdf"
                },
                "status": "graded"
            }
        ]
    }

@app.get("/api/quizzes/{quiz_id}/my-attempts")
async def get_quiz_attempts(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Get student's attempts for this quiz
        attempts = db.query(StudentQuizAttempt).filter(
            StudentQuizAttempt.quiz_id == quiz_id,
            StudentQuizAttempt.user_id == current_user.id
        ).order_by(StudentQuizAttempt.completed_at.desc()).all()

        attempt_list = []
        for i, attempt in enumerate(attempts):
            attempt_list.append({
                "id": attempt.id,
                "attempt_number": i + 1,
                "score": attempt.score,
                "total_points": attempt.total_points,
                "completed_at": attempt.completed_at.isoformat(),
                "time_taken": attempt.time_taken
            })

        return {"attempts": attempt_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get quiz attempts: {str(e)}")

@app.post("/api/quizzes/{quiz_id}/start")
async def start_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        # Check if student can take the quiz
        attempts = db.query(StudentQuizAttempt).filter(
            StudentQuizAttempt.quiz_id == quiz_id,
            StudentQuizAttempt.user_id == current_user.id
        ).count()

        if attempts >= quiz.max_attempts:
            raise HTTPException(status_code=400, detail="Maximum attempts reached")

        # Create new attempt
        attempt = StudentQuizAttempt(
            quiz_id=quiz_id,
            user_id=current_user.id,
            started_at=datetime.now(),
            score=0,
            total_points=0,
            time_taken=0
        )

        db.add(attempt)
        db.commit()
        db.refresh(attempt)

        return {"attempt_id": attempt.id, "message": "Quiz started successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start quiz: {str(e)}")

# ============================================================================
# Additional Student Endpoints
# ============================================================================

@app.get("/api/student/grades")
async def get_student_grades():
    """
    Demo endpoint for student grades - returns mock data
    """
    return {
        "grades": [
            {
                "id": 1,
                "assignment_title": "HW 1: Variables & Data Types",
                "course_name": "Introduction to Programming",
                "course_code": "CS101",
                "grade": 95,
                "max_points": 100,
                "percentage": 95.0,
                "assignment_type": "homework",
                "submitted_date": "2024-03-10T20:00:00",
                "graded_date": "2024-03-11T15:00:00",
                "status": "graded"
            },
            {
                "id": 2,
                "assignment_title": "Project Proposal",
                "course_name": "Data Structures and Algorithms",
                "course_code": "CS201",
                "grade": 88,
                "max_points": 100,
                "percentage": 88.0,
                "assignment_type": "project",
                "submitted_date": "2024-03-12T18:00:00",
                "graded_date": "2024-03-13T14:00:00",
                "status": "graded"
            },
            {
                "id": 3,
                "assignment_title": "Database Design Assignment",
                "course_name": "Database Systems",
                "course_code": "CS301",
                "grade": 92,
                "max_points": 100,
                "percentage": 92.0,
                "assignment_type": "assignment",
                "submitted_date": "2024-03-18T20:00:00",
                "graded_date": "2024-03-19T15:00:00",
                "status": "graded"
            }
        ]
    }

@app.get("/api/student/course-grades")
async def get_student_course_grades():
    """
    Demo endpoint for student course grades - returns mock data
    """
    return {
        "course_grades": [
            {
                "course_id": 1,
                "course_name": "Introduction to Programming",
                "course_code": "CS101",
                "credits": 3,
                "current_grade": 95,
                "letter_grade": "A",
                "assignments_completed": 5,
                "total_assignments": 5,
                "attendance_percentage": 98.0
            },
            {
                "course_id": 2,
                "course_name": "Data Structures",
                "course_code": "CS201",
                "credits": 4,
                "current_grade": 88,
                "letter_grade": "B+",
                "assignments_completed": 4,
                "total_assignments": 5,
                "attendance_percentage": 92.0
            },
            {
                "course_id": 3,
                "course_name": "Algorithms",
                "course_code": "CS301",
                "credits": 3,
                "current_grade": 78,
                "letter_grade": "C+",
                "assignments_completed": 3,
                "total_assignments": 5,
                "attendance_percentage": 85.0
            }
        ]
    }

@app.get("/api/student/semesters")
async def get_student_semesters():
    return {
        "semesters": [
            {"id": 1, "name": "Spring", "year": 2024, "gpa": 3.85, "credits": 18, "is_current": True},
            {"id": 2, "name": "Fall", "year": 2023, "gpa": 3.72, "credits": 20, "is_current": False}
        ]
    }

@app.get("/api/student/submissions")
async def get_student_submissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != UserRole.STUDENT:
            raise HTTPException(status_code=403, detail="Access denied")

        # Get all submissions by the student
        submissions = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.student_id == current_user.id
        ).all()

        submission_list = []
        for submission in submissions:
            assignment = submission.assignment
            submission_list.append({
                "id": submission.id,
                "assignment_title": assignment.title,
                "course_name": assignment.course.name,
                "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
                "grade": submission.grade,
                "max_points": assignment.max_points,
                "feedback": submission.feedback,
                "file_path": submission.file_url,
                "status": "Graded" if submission.grade is not None else "Submitted"
            })

        return {"submissions": submission_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get student submissions: {str(e)}")

@app.get("/api/student/quiz-attempts")
async def get_student_quiz_attempts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        if current_user.role != UserRole.STUDENT:
            raise HTTPException(status_code=403, detail="Access denied")

        # Get all quiz attempts by the student
        attempts = db.query(StudentQuizAttempt).filter(
            StudentQuizAttempt.user_id == current_user.id
        ).all()

        attempt_list = []
        for attempt in attempts:
            quiz = attempt.quiz
            attempt_list.append({
                "id": attempt.id,
                "quiz_title": quiz.title,
                "course_name": quiz.course.name,
                "started_at": attempt.started_at.isoformat() if attempt.started_at else None,
                "completed_at": attempt.completed_at.isoformat() if attempt.completed_at else None,
                "score": attempt.score,
                "total_points": attempt.total_points,
                "time_taken": attempt.time_taken,
                "status": "Completed" if attempt.completed_at else "In Progress"
            })

        return {"attempts": attempt_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get quiz attempts: {str(e)}")

# ============================================================================


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/api/courses/{course_id}")
async def get_course_details(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Check permissions
        if current_user.role not in [UserRole.ADMIN, UserRole.LECTURER, UserRole.STUDENT]:
            raise HTTPException(status_code=403, detail="Access denied")

        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Check access permissions
        has_access = False
        if current_user.role == UserRole.ADMIN:
            has_access = True
        elif current_user.role == UserRole.LECTURER and course.lecturer_id == current_user.id:
            has_access = True
        elif current_user.role == UserRole.STUDENT:
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == course_id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            ).first()
            has_access = enrollment is not None

        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")

        # Get enrollment count
        enrollment_count = db.query(Enrollment).filter(
            Enrollment.course_id == course_id,
            Enrollment.status == EnrollmentStatus.ENROLLED
        ).count()

        # Get course materials count
        materials_count = db.query(CourseMaterial).filter(
            CourseMaterial.course_id == course_id,
            CourseMaterial.is_active == True
        ).count()

        # Get assignments count
        assignments_count = db.query(Assignment).filter(
            Assignment.course_id == course_id
        ).count()

        # Get lessons count
        lessons_count = db.query(Lesson).filter(
            Lesson.course_id == course_id,
            Lesson.is_published == True
        ).count()

        # Safely get related data with null checks
        department_name = None
        lecturer_name = "TBA"
        semester_name = None

        try:
            if course.department:
                department_name = course.department.name
        except:
            department_name = None

        try:
            if course.lecturer:
                lecturer_name = course.lecturer.name
        except:
            lecturer_name = "TBA"

        try:
            if course.semester:
                semester_name = course.semester.name
        except:
            semester_name = None

        # Parse course content from syllabus field
        course_content = None
        try:
            if course.syllabus:
                course_content = json.loads(course.syllabus)
        except:
            course_content = None

        course_data = {
            "id": course.id,
            "name": course.name,
            "code": course.code,
            "description": course.description,
            "credits": course.credits,
            "max_capacity": course.max_capacity,
            "enrolled_count": enrollment_count,
            "available_spots": course.max_capacity - enrollment_count,
            "prerequisites": course.prerequisites,
            "syllabus": course.syllabus,
            "is_active": course.is_active,
            "created_at": course.created_at.isoformat(),
            "department_name": department_name,
            "department_id": course.department_id,
            "lecturer_name": lecturer_name,
            "lecturer_id": course.lecturer_id,
            "semester_name": semester_name,
            "semester_id": course.semester_id,
            "materials_count": materials_count,
            "assignments_count": assignments_count,
            "lessons_count": lessons_count,
            "course_content": course_content
        }

        return {"course": course_data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get course details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get course details: {str(e)}")

@app.get("/api/academic/programs/{program_id}")
async def get_program_details(
    program_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Check permissions
        if current_user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise HTTPException(status_code=403, detail="Access denied")

        program = db.query(Program).filter(Program.id == program_id).first()
        if not program:
            raise HTTPException(status_code=404, detail="Program not found")

        # Get courses in the same department
        department_courses = db.query(Course).filter(
            Course.department_id == program.department_id,
            Course.is_active == True
        ).all()

        # Get enrolled students count
        enrolled_students = db.query(Enrollment).filter(
            Enrollment.program_id == program_id,
            Enrollment.status == EnrollmentStatus.ENROLLED
        ).count()

        # Get program statistics
        program_stats = {
            "total_courses": len(department_courses),
            "enrolled_students": enrolled_students,
            "active_courses": len([c for c in department_courses if c.is_active]),
            "total_credits_offered": sum(c.credits for c in department_courses if c.is_active)
        }

        program_data = {
            "id": program.id,
            "name": program.name,
            "code": program.code,
            "description": program.description,
            "program_type": program.program_type.value if hasattr(program.program_type, 'value') else str(program.program_type),
            "department_name": program.department.name,
            "department_id": program.department_id,
            "duration_years": program.duration_years,
            "total_credits": program.total_credits,
            "is_active": program.is_active,
            "created_at": program.created_at.isoformat(),
            "statistics": program_stats
        }

        return {"program": program_data}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get program details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get program details: {str(e)}")

# ============================================================================
# Lecturer-Program Assignment Management
# ============================================================================

@app.get("/api/academic/programs/{program_id}/lecturers")
async def get_program_lecturers(
    program_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all lecturers assigned to a specific program"""
    try:
        if current_user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise HTTPException(status_code=403, detail="Access denied")

        # Check if program exists
        program = db.query(Program).filter(Program.id == program_id).first()
        if not program:
            raise HTTPException(status_code=404, detail="Program not found")

        # Get lecturer assignments
        assignments = db.query(ProgramLecturer).filter(
            ProgramLecturer.program_id == program_id,
            ProgramLecturer.is_active == True
        ).all()

        lecturer_list = []
        for assignment in assignments:
            lecturer = assignment.lecturer
            lecturer_list.append({
                "id": assignment.id,
                "lecturer_id": lecturer.id,
                "lecturer_name": lecturer.name,
                "lecturer_email": lecturer.email,
                "role": assignment.role,
                "assigned_at": assignment.assigned_at.isoformat(),
                "assigned_by": assignment.assigned_by.name if assignment.assigned_by else "System"
            })

        return {"lecturers": lecturer_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get program lecturers: {str(e)}")

@app.post("/api/academic/programs/{program_id}/lecturers")
async def assign_lecturer_to_program(
    program_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assign a lecturer to a program"""
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        lecturer_id = request.get("lecturer_id")
        role = request.get("role", "lecturer")

        if not lecturer_id:
            raise HTTPException(status_code=400, detail="lecturer_id is required")

        # Check if program exists
        program = db.query(Program).filter(Program.id == program_id).first()
        if not program:
            raise HTTPException(status_code=404, detail="Program not found")

        # Check if lecturer exists and is a lecturer
        lecturer = db.query(User).filter(
            User.id == lecturer_id,
            User.role == UserRole.LECTURER
        ).first()
        if not lecturer:
            raise HTTPException(status_code=404, detail="Lecturer not found")

        # Check if assignment already exists (including inactive ones)
        existing = db.query(ProgramLecturer).filter(
            ProgramLecturer.program_id == program_id,
            ProgramLecturer.lecturer_id == lecturer_id
        ).first()
        
        if existing:
            if existing.is_active:
                raise HTTPException(status_code=400, detail="Lecturer is already assigned to this program")
            else:
                # Reactivate existing assignment
                existing.is_active = True
                existing.role = role
                existing.assigned_by_id = current_user.id
                existing.assigned_at = datetime.now(timezone.utc)
                db.commit()
                
                return {
                    "message": "Lecturer assignment reactivated successfully",
                    "assignment": {
                        "id": existing.id,
                        "lecturer_name": lecturer.name,
                        "program_name": program.name,
                        "role": existing.role
                    }
                }

        # Create new assignment
        assignment = ProgramLecturer(
            program_id=program_id,
            lecturer_id=lecturer_id,
            assigned_by_id=current_user.id,
            role=role
        )

        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        return {
            "message": "Lecturer assigned to program successfully",
            "assignment": {
                "id": assignment.id,
                "lecturer_name": lecturer.name,
                "program_name": program.name,
                "role": assignment.role
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign lecturer: {str(e)}")

@app.put("/api/academic/programs/{program_id}/lecturers/{assignment_id}")
async def update_lecturer_assignment(
    program_id: int,
    assignment_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update lecturer assignment details"""
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        assignment = db.query(ProgramLecturer).filter(
            ProgramLecturer.id == assignment_id,
            ProgramLecturer.program_id == program_id
        ).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

        # Update fields
        if "role" in request:
            assignment.role = request["role"]
        if "is_active" in request:
            assignment.is_active = request["is_active"]

        db.commit()
        return {"message": "Assignment updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update assignment: {str(e)}")

@app.delete("/api/academic/programs/{program_id}/lecturers/{assignment_id}")
async def remove_lecturer_from_program(
    program_id: int,
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove lecturer assignment from program"""
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        assignment = db.query(ProgramLecturer).filter(
            ProgramLecturer.id == assignment_id,
            ProgramLecturer.program_id == program_id
        ).first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")

        # Soft delete by setting is_active to False
        assignment.is_active = False
        db.commit()

        return {"message": "Lecturer removed from program successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove lecturer: {str(e)}")

@app.get("/api/academic/lecturers/{lecturer_id}/programs")
async def get_lecturer_programs_detailed(
    lecturer_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all programs assigned to a specific lecturer"""
    try:
        if current_user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise HTTPException(status_code=403, detail="Access denied")

        # Check if lecturer exists
        lecturer = db.query(User).filter(
            User.id == lecturer_id,
            User.role == UserRole.LECTURER
        ).first()
        if not lecturer:
            raise HTTPException(status_code=404, detail="Lecturer not found")

        # Get program assignments
        assignments = db.query(ProgramLecturer).filter(
            ProgramLecturer.lecturer_id == lecturer_id,
            ProgramLecturer.is_active == True
        ).all()

        program_list = []
        for assignment in assignments:
            program = assignment.program
            program_list.append({
                "id": program.id,
                "name": program.name,
                "code": program.code,
                "description": program.description,
                "department": program.department.name,
                "duration_years": program.duration_years,
                "total_credits": program.total_credits,
                "role": assignment.role,
                "assigned_at": assignment.assigned_at.isoformat()
            })

        return {"programs": program_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get lecturer programs: {str(e)}")

# ============================================================================

# ============================================================================
# Course-specific endpoints for assignments and submissions
# ============================================================================

@app.get("/api/courses/{course_id}/assignments")
async def get_course_assignments(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Check permissions
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        has_access = False
        if current_user.role == UserRole.ADMIN:
            has_access = True
        elif current_user.role == UserRole.LECTURER and course.lecturer_id == current_user.id:
            has_access = True
        elif current_user.role == UserRole.STUDENT:
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == course_id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            ).first()
            has_access = enrollment is not None

        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")

        # Get assignments for this course
        assignments = db.query(Assignment).filter(
            Assignment.course_id == course_id
        ).order_by(Assignment.due_date.desc()).all()

        assignment_list = []
        for assignment in assignments:
            # Count submissions
            submission_count = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == assignment.id
            ).count()

            # Count graded submissions
            graded_count = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == assignment.id,
                AssignmentSubmission.grade.isnot(None)
            ).count()

            assignment_list.append({
                "id": assignment.id,
                "title": assignment.title,
                "description": assignment.description,
                "due_date": assignment.due_date.isoformat(),
                "max_points": assignment.max_points,
                "assignment_type": assignment.assignment_type,
                "is_published": assignment.is_published,
                "submission_count": submission_count,
                "graded_count": graded_count,
                "created_at": assignment.created_at.isoformat()
            })

        return {"assignments": assignment_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get course assignments: {str(e)}")

@app.get("/api/courses/{course_id}/submissions")
async def get_course_submissions(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Check permissions
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        has_access = False
        if current_user.role == UserRole.ADMIN:
            has_access = True
        elif current_user.role == UserRole.LECTURER and course.lecturer_id == current_user.id:
            has_access = True
        elif current_user.role == UserRole.STUDENT:
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == course_id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            ).first()
            has_access = enrollment is not None

        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")

        # Get all assignments for this course
        assignments = db.query(Assignment).filter(
            Assignment.course_id == course_id
        ).all()

        assignment_ids = [assignment.id for assignment in assignments]

        # Get all submissions for these assignments
        submissions = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id.in_(assignment_ids)
        ).all()

        submission_list = []
        for submission in submissions:
            assignment = submission.assignment
            student = submission.student
            
            submission_list.append({
                "id": submission.id,
                "student_name": student.name,
                "student_email": student.email,
                "assignment_title": assignment.title,
                "submitted_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
                "grade": submission.grade,
                "feedback": submission.feedback,
                "is_late": submission.is_late,
                "file_name": submission.file_name
            })

        return {"submissions": submission_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get course submissions: {str(e)}")

# ============================================================================

@app.put("/api/courses/{course_id}/content")
async def update_course_content(
    course_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Only allow admins to update course content
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Update course content
        course_content = request.get("course_content", {})
        
        # Store content as JSON in the syllabus field (or create a new field)
        # For now, we'll use the syllabus field to store the rich content
        course.syllabus = json.dumps(course_content)

        db.commit()
        return {"message": "Course content updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update course content: {str(e)}")

# ============================================================================
# Program Course Allocation Management
# ============================================================================

@app.get("/api/academic/programs/{program_id}/courses")
async def get_program_courses(
    program_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all courses allocated to a specific program"""
    try:
        if current_user.role not in [UserRole.ADMIN, UserRole.LECTURER]:
            raise HTTPException(status_code=403, detail="Access denied")

        # Check if program exists
        program = db.query(Program).filter(Program.id == program_id).first()
        if not program:
            raise HTTPException(status_code=404, detail="Program not found")

        # Get actual course allocations from ProgramCourse table
        allocations = db.query(ProgramCourse).filter(
            ProgramCourse.program_id == program_id,
            ProgramCourse.is_active == True
        ).all()

        course_list = []
        for allocation in allocations:
            course = allocation.course
            course_list.append({
                "id": allocation.id,
                "course_id": course.id,
                "program_id": program_id,
                "course_name": course.name,
                "course_code": course.code,
                "credits": course.credits,
                "allocated_at": allocation.allocated_at.isoformat(),
                "is_required": allocation.is_required,
                "semester_order": allocation.semester_order
            })

        return {"courses": course_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get program courses: {str(e)}")

@app.post("/api/academic/programs/{program_id}/courses")
async def allocate_course_to_program(
    program_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allocate a course to a program"""
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        course_id = request.get("course_id")
        is_required = request.get("is_required", True)
        semester_order = request.get("semester_order", 1)

        if not course_id:
            raise HTTPException(status_code=400, detail="course_id is required")

        # Check if program exists
        program = db.query(Program).filter(Program.id == program_id).first()
        if not program:
            raise HTTPException(status_code=404, detail="Program not found")

        # Check if course exists
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        # Check if course is already allocated to this program (including inactive ones)
        existing_allocation = db.query(ProgramCourse).filter(
            ProgramCourse.program_id == program_id,
            ProgramCourse.course_id == course_id
        ).first()
        
        if existing_allocation:
            if existing_allocation.is_active:
                raise HTTPException(status_code=400, detail="Course is already allocated to this program")
            else:
                # Reactivate existing allocation
                existing_allocation.is_active = True
                existing_allocation.is_required = is_required
                existing_allocation.semester_order = semester_order
                existing_allocation.allocated_by_id = current_user.id
                existing_allocation.allocated_at = datetime.now(timezone.utc)
                db.commit()
                
                return {
                    "message": "Course allocation reactivated successfully",
                    "allocation": {
                        "id": existing_allocation.id,
                        "course_id": course_id,
                        "program_id": program_id,
                        "course_name": course.name,
                        "is_required": is_required,
                        "semester_order": semester_order
                    }
                }

        # Create new allocation
        allocation = ProgramCourse(
            program_id=program_id,
            course_id=course_id,
            is_required=is_required,
            semester_order=semester_order,
            allocated_by_id=current_user.id
        )

        db.add(allocation)
        db.commit()
        db.refresh(allocation)

        return {
            "message": "Course allocated to program successfully",
            "allocation": {
                "id": allocation.id,
                "course_id": course_id,
                "program_id": program_id,
                "course_name": course.name,
                "is_required": is_required,
                "semester_order": semester_order
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to allocate course: {str(e)}")

@app.put("/api/academic/programs/{program_id}/courses/{allocation_id}")
async def update_course_allocation(
    program_id: int,
    allocation_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update course allocation details"""
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        # Check if allocation exists
        allocation = db.query(ProgramCourse).filter(
            ProgramCourse.id == allocation_id,
            ProgramCourse.program_id == program_id
        ).first()
        if not allocation:
            raise HTTPException(status_code=404, detail="Course allocation not found")

        # Update fields
        if "is_required" in request:
            allocation.is_required = request["is_required"]
        if "semester_order" in request:
            allocation.semester_order = request["semester_order"]
        if "is_active" in request:
            allocation.is_active = request["is_active"]

        db.commit()
        return {"message": "Course allocation updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update course allocation: {str(e)}")

@app.delete("/api/academic/programs/{program_id}/courses/{allocation_id}")
async def remove_course_allocation(
    program_id: int,
    allocation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove course allocation from program"""
    try:
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")

        # Check if allocation exists
        allocation = db.query(ProgramCourse).filter(
            ProgramCourse.id == allocation_id,
            ProgramCourse.program_id == program_id
        ).first()
        if not allocation:
            raise HTTPException(status_code=404, detail="Course allocation not found")

        # Soft delete by setting is_active to False
        allocation.is_active = False
        db.commit()

        return {"message": "Course allocation removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove course allocation: {str(e)}")

@app.get("/api/materials/{material_id}/stream")
async def stream_material(
    material_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Stream material file for video playback with range request support"""
    try:
        material = db.query(CourseMaterial).filter(CourseMaterial.id == material_id).first()
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")

        # Check access permissions (same as get_course_materials)
        course = material.course
        has_access = False
        if current_user.role == UserRole.ADMIN:
            has_access = True
        elif current_user.role == UserRole.LECTURER and course.lecturer_id == current_user.id:
            has_access = True
        elif current_user.role == UserRole.STUDENT:
            enrollment = db.query(Enrollment).filter(
                Enrollment.student_id == current_user.id,
                Enrollment.course_id == course.id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            ).first()
            has_access = enrollment is not None

        if not has_access:
            raise HTTPException(status_code=403, detail="Access denied")

        # Return file for streaming with range request support
        if os.path.exists(material.file_path):
            file_size = os.path.getsize(material.file_path)
            
            # Handle range requests for video streaming
            range_header = request.headers.get('range')
            if range_header:
                try:
                    # Parse range header (e.g., "bytes=0-1023")
                    range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
                    if range_match:
                        start = int(range_match.group(1))
                        end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
                        
                        if start >= file_size:
                            raise HTTPException(status_code=416, detail="Range not satisfiable")
                        
                        # Read the requested range
                        with open(material.file_path, 'rb') as f:
                            f.seek(start)
                            data = f.read(end - start + 1)
                        
                        # Return partial content response
                        headers = {
                            'Content-Range': f'bytes {start}-{end}/{file_size}',
                            'Accept-Ranges': 'bytes',
                            'Content-Length': str(len(data)),
                            'Content-Type': material.file_type,
                        }
                        
                        return Response(
                            content=data,
                            status_code=206,
                            headers=headers
                        )
                except (ValueError, IndexError):
                    pass
            
            # Return full file if no range request or invalid range
            return FileResponse(
                path=material.file_path,
                filename=material.file_name,
                media_type=material.file_type,
                headers={'Accept-Ranges': 'bytes'}
            )
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stream material: {str(e)}")

@app.get("/api/debug/enrollments")
async def debug_enrollments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Debug endpoint to check enrollment data"""
    try:
        # Check if user is admin
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get all enrollments
        all_enrollments = db.query(Enrollment).all()
        
        # Get all students
        all_students = db.query(User).filter(User.role == UserRole.STUDENT).all()
        
        # Get all courses
        all_courses = db.query(Course).all()
        
        # Get all programs
        all_programs = db.query(Program).all()
        
        # Get all semesters
        all_semesters = db.query(Semester).all()
        
        debug_data = {
            "total_enrollments": len(all_enrollments),
            "total_students": len(all_students),
            "total_courses": len(all_courses),
            "total_programs": len(all_programs),
            "total_semesters": len(all_semesters),
            "enrollments": [
                {
                    "id": e.id,
                    "student_id": e.student_id,
                    "course_id": e.course_id,
                    "program_id": e.program_id,
                    "status": e.status.value,
                    "enrollment_date": e.enrollment_date.isoformat(),
                    "is_active": e.is_active
                }
                for e in all_enrollments
            ],
            "students": [
                {
                    "id": s.id,
                    "name": s.name,
                    "email": s.email,
                    "role": s.role.value
                }
                for s in all_students
            ],
            "courses": [
                {
                    "id": c.id,
                    "name": c.name,
                    "code": c.code,
                    "semester_id": c.semester_id,
                    "lecturer_id": c.lecturer_id
                }
                for c in all_courses
            ]
        }
        
        return debug_data
    except Exception as e:
        logger.error(f"Debug endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Debug error: {str(e)}")

@app.get("/api/debug/course-materials/{course_id}")
async def debug_course_materials(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Debug endpoint to check course materials and file paths"""
    try:
        # Check if user is admin
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get course
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return {"error": "Course not found"}
        
        # Get all materials for this course
        materials = db.query(CourseMaterial).filter(
            CourseMaterial.course_id == course_id,
            CourseMaterial.is_active == True
        ).all()
        
        debug_data = {
            "course": {
                "id": course.id,
                "name": course.name,
                "code": course.code,
                "lecturer_id": course.lecturer_id
            },
            "total_materials": len(materials),
            "video_materials": [],
            "document_materials": [],
            "file_paths_exist": {}
        }
        
        for material in materials:
            file_exists = os.path.exists(material.file_path) if material.file_path else False
            file_size = os.path.getsize(material.file_path) if file_exists else 0
            
            material_data = {
                "id": material.id,
                "title": material.title,
                "material_type": material.material_type,
                "file_name": material.file_name,
                "file_path": material.file_path,
                "file_exists": file_exists,
                "file_size": file_size,
                "file_type": material.file_type,
                "uploaded_at": material.created_at.isoformat(),
                "uploaded_by": material.uploaded_by.name if material.uploaded_by else "Unknown"
            }
            
            if material.material_type == "video":
                debug_data["video_materials"].append(material_data)
            else:
                debug_data["document_materials"].append(material_data)
            
            debug_data["file_paths_exist"][material.id] = file_exists
        
        return debug_data
    except Exception as e:
        logger.error(f"Debug course materials error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Debug error: {str(e)}")

@app.post("/api/test/create-sample-video/{course_id}")
async def create_sample_video(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a sample video material for testing"""
    try:
        # Check if user is admin
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if course exists
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Create a sample video file path (this would normally be uploaded)
        sample_video_path = "uploads/videos/sample_video.mp4"
        
        # Create the uploads/videos directory if it doesn't exist
        os.makedirs("uploads/videos", exist_ok=True)
        
        # Create a sample video material record
        material = CourseMaterial(
            course_id=course_id,
            title="Sample Video for Testing",
            description="This is a sample video material created for testing the video player functionality.",
            file_name="sample_video.mp4",
            file_path=sample_video_path,
            file_size=1024 * 1024,  # 1MB placeholder
            file_type="video/mp4",
            material_type="video",
            uploaded_by_id=current_user.id
        )
        
        db.add(material)
        db.commit()
        db.refresh(material)
        
        return {
            "message": "Sample video material created successfully",
            "material_id": material.id,
            "file_path": material.file_path,
            "note": "This is a placeholder. You need to upload an actual video file to test playback."
        }
    except Exception as e:
        logger.error(f"Create sample video error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ============================================================================
# Predefined Users for Portfolio Demo
# ============================================================================

@app.get("/api/predefined-users")
async def get_predefined_users():
    """Get predefined users for portfolio demo"""
    predefined_users = {
        "admin": {
            "id": 1,
            "name": "System Administrator",
            "email": "admin@lms.edu",
            "role": "admin",
            "subscription_status": "premium"
        },
        "lecturer": {
            "id": 2,
            "name": "Dr. Sarah Johnson",
            "email": "sarah.johnson@lms.edu",
            "role": "lecturer",
            "subscription_status": "premium"
        },
        "student": {
            "id": 3,
            "name": "Alice Smith",
            "email": "alice.smith@student.lms.edu",
            "role": "student",
            "subscription_status": "free"
        }
    }
    return {"users": predefined_users}

@app.get("/api/user")
async def get_current_user_demo():
    """Get current user for demo purposes"""
    # For demo purposes, return a default user
    # In a real app, this would check cookies/tokens
    return {
        "user": {
            "id": 3,
            "name": "Alice Smith",
            "email": "alice.smith@student.lms.edu",
            "role": "student",
            "subscription_status": "free"
        }
    }

@app.get("/api/materials")
async def get_materials():
    return {"materials": [{"id": 1, "title": "Demo Material", "type": "document", "url": "/videos/demo.mp4"}]}

@app.post("/api/materials")
async def create_material(request: dict):
    return {"material": {"id": 2, **request}, "message": "Material created successfully"}

@app.get("/api/lessons")
async def get_lessons():
    return {"lessons": [{"id": 1, "title": "Demo Lesson", "content": "This is a demo lesson."}]}

@app.post("/api/lessons")
async def create_lesson(request: dict):
    return {"lesson": {"id": 2, **request}, "message": "Lesson created successfully"}

@app.get("/api/analytics")
async def get_analytics():
    return {"analytics": {"active_users": 3, "assignments_submitted": 2, "courses": 2}}

@app.get("/api/student/grades")
async def get_student_grades(semester_id: int = Query(None)):
    return {
        "grades": [
            {"id": 1, "assignment_title": "HW 1: Variables & Data Types", "course_name": "Introduction to Programming", "course_code": "CS101", "grade": 95, "max_points": 100, "percentage": 95, "assignment_type": "Homework", "submitted_date": "2024-03-01", "graded_date": "2024-03-03", "feedback": "Great job!", "is_late": False},
            {"id": 2, "assignment_title": "Project Proposal", "course_name": "Data Structures and Algorithms", "course_code": "CS201", "grade": 88, "max_points": 100, "percentage": 88, "assignment_type": "Project", "submitted_date": "2024-03-05", "graded_date": "2024-03-07", "feedback": "Well done.", "is_late": False}
        ]
    }

@app.get("/api/student/course-grades")
async def get_student_course_grades(semester_id: int = Query(None)):
    return {
        "course_grades": [
            {"course_id": 101, "course_name": "Introduction to Programming", "course_code": "CS101", "credits": 3, "current_grade": 95, "letter_grade": "A", "assignments_completed": 5, "total_assignments": 6, "attendance_percentage": 97},
            {"course_id": 102, "course_name": "Data Structures and Algorithms", "course_code": "CS201", "credits": 4, "current_grade": 88, "letter_grade": "B+", "assignments_completed": 4, "total_assignments": 5, "attendance_percentage": 92}
        ]
    }

# Mock enrollments data for demo
MOCK_ENROLLMENTS = [
    {
        "id": 1,
        "course_id": 101,
        "course_name": "Introduction to Programming",
        "course_code": "CS101",
        "program": "Bachelor of Computer Science",
        "semester": "Fall 2023",
        "enrollment_date": "2023-09-01T00:00:00",
        "status": "active",
        "grade": 95,
        "credits": 3
    },
    {
        "id": 2,
        "course_id": 102,
        "course_name": "Data Structures and Algorithms",
        "course_code": "CS201",
        "program": "Bachelor of Computer Science",
        "semester": "Fall 2023",
        "enrollment_date": "2023-09-01T00:00:00",
        "status": "active",
        "grade": 88,
        "credits": 4
    },
    {
        "id": 3,
        "course_id": 103,
        "course_name": "Database Systems",
        "course_code": "CS301",
        "program": "Bachelor of Computer Science",
        "semester": "Spring 2024",
        "enrollment_date": "2024-01-10T00:00:00",
        "status": "active",
        "grade": 92,
        "credits": 3
    }
]

# Mock discussions data for demo
MOCK_DISCUSSIONS = [
    {
        "id": 1,
        "title": "Welcome to the course!",
        "content": "Introduce yourself and share your goals for this course.",
        "author": "Dr. Sarah Johnson",
        "author_role": "lecturer",
        "created_at": "2024-01-10T10:00:00",
        "updated_at": "2024-01-10T10:00:00",
        "replies_count": 2,
        "last_reply_at": "2024-01-12T12:00:00",
        "last_reply_author": "Alice Smith",
        "is_pinned": True,
        "is_locked": False,
        "course_id": 101,
        "course_name": "Introduction to Programming",
        "course_code": "CS101"
    },
    {
        "id": 2,
        "title": "Assignment 1 Discussion",
        "content": "Discuss any questions or issues with Assignment 1 here.",
        "author": "Alice Smith",
        "author_role": "student",
        "created_at": "2024-01-15T09:00:00",
        "updated_at": "2024-01-15T09:00:00",
        "replies_count": 1,
        "last_reply_at": "2024-01-16T14:00:00",
        "last_reply_author": "Dr. Sarah Johnson",
        "is_pinned": False,
        "is_locked": False,
        "course_id": 101,
        "course_name": "Introduction to Programming",
        "course_code": "CS101"
    }
]

MOCK_REPLIES = [
    {
        "id": 1,
        "content": "Hi everyone! I'm excited to learn.",
        "author": "Alice Smith",
        "author_role": "student",
        "created_at": "2024-01-10T11:00:00",
        "updated_at": "2024-01-10T11:00:00",
        "discussion_id": 1
    },
    {
        "id": 2,
        "content": "Welcome Alice! Looking forward to your participation.",
        "author": "Dr. Sarah Johnson",
        "author_role": "lecturer",
        "created_at": "2024-01-12T12:00:00",
        "updated_at": "2024-01-12T12:00:00",
        "discussion_id": 1
    },
    {
        "id": 3,
        "content": "I'm having trouble with question 3 on Assignment 1.",
        "author": "Bob Smith",
        "author_role": "student",
        "created_at": "2024-01-15T10:00:00",
        "updated_at": "2024-01-15T10:00:00",
        "discussion_id": 2
    },
    {
        "id": 4,
        "content": "Check the lecture notes for hints!",
        "author": "Dr. Sarah Johnson",
        "author_role": "lecturer",
        "created_at": "2024-01-16T14:00:00",
        "updated_at": "2024-01-16T14:00:00",
        "discussion_id": 2
    }
]

@app.get("/api/courses/{course_id}/discussions")
async def get_course_discussions(course_id: int):
    """
    Demo endpoint for course discussions - returns mock data
    """
    discussions = [d for d in MOCK_DISCUSSIONS if d["course_id"] == course_id]
    return {"discussions": discussions}

@app.post("/api/discussions")
async def create_discussion(request: dict):
    """
    Demo endpoint for creating a discussion - just returns success
    """
    return {"discussion": {"id": 999, **request}, "message": "Discussion created successfully"}

@app.get("/api/discussions/{discussion_id}/replies")
async def get_discussion_replies(discussion_id: int):
    """
    Demo endpoint for discussion replies - returns mock data
    """
    replies = [r for r in MOCK_REPLIES if r["discussion_id"] == discussion_id]
    return {"replies": replies}

@app.post("/api/discussions/{discussion_id}/replies")
async def create_discussion_reply(discussion_id: int, request: dict):
    """
    Demo endpoint for creating a reply - just returns success
    """
    return {"reply": {"id": 999, **request}, "message": "Reply created successfully"}

if __name__ == "__main__":
    # Database is initialized automatically in initialize_fresh_database()
    # No need for additional seeding here

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )







