from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON, Float, Enum, func, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime, timezone
import enum

Base = declarative_base()

# Enums for MasterLMS
class UserRole(enum.Enum):
    ADMIN = "admin"
    LECTURER = "lecturer"
    STUDENT = "student"

class ProgramType(enum.Enum):
    BACHELOR = "bachelor"
    MASTER = "master"
    PHD = "phd"
    DIPLOMA = "diploma"
    CERTIFICATE = "certificate"

class SemesterType(enum.Enum):
    FALL = "fall"
    SPRING = "spring"
    SUMMER = "summer"

class EnrollmentStatus(enum.Enum):
    ENROLLED = "enrolled"
    COMPLETED = "completed"
    DROPPED = "dropped"
    PENDING = "pending"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

    # MasterLMS Extensions
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    student_id = Column(String(20), unique=True, nullable=True)  # For students
    employee_id = Column(String(20), unique=True, nullable=True)  # For staff
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)  # For lecturers
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    profile_picture = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    subscription_status = Column(String(20), default="free")  # free, premium, enterprise

    # Keep existing fields
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships (keep existing + new)
    quiz_attempts = relationship("QuizAttempt", back_populates="user")
    pdf_uploads = relationship("PDFDocument", back_populates="user")
    chat_sessions = relationship("ChatSession", back_populates="user")

    # New MasterLMS relationships
    student_enrollments = relationship("Enrollment", foreign_keys="Enrollment.student_id", back_populates="student")
    lecturer_courses = relationship("Course", back_populates="lecturer")
    program_assignments = relationship("ProgramLecturer", foreign_keys="ProgramLecturer.lecturer_id", back_populates="lecturer")

    notifications = relationship("Notification", back_populates="user")

    # Table constraints
    __table_args__ = (
        # Ensure only one of student_id or employee_id is set
        CheckConstraint(
            "(student_id IS NOT NULL AND employee_id IS NULL) OR (student_id IS NULL AND employee_id IS NOT NULL) OR (student_id IS NULL AND employee_id IS NULL)",
            name="check_student_or_employee_id"
        ),
    )

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String(100), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    correct_answer = Column(String(500), nullable=False)
    options = Column(JSON, nullable=False)  # Array of options
    difficulty = Column(String(20), default="medium")  # easy, medium, hard
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    quiz_attempts = relationship("QuizAttempt", back_populates="question")

# Enhanced Quiz System Models
class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    time_limit = Column(Integer, nullable=False, default=30)  # minutes
    max_attempts = Column(Integer, nullable=False, default=3)
    is_published = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    course = relationship("Course", back_populates="quizzes")
    created_by = relationship("User", foreign_keys=[created_by_id])
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("StudentQuizAttempt", back_populates="quiz")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False, default="multiple_choice")  # multiple_choice, true_false, short_answer
    options = Column(JSON, nullable=True)  # Array of options for multiple choice
    correct_answer = Column(String(500), nullable=False)
    points = Column(Float, nullable=False, default=1.0)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")

class StudentQuizAttempt(Base):
    __tablename__ = "student_quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    attempt_number = Column(Integer, nullable=False, default=1)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    score = Column(Float, nullable=True)
    total_points = Column(Float, nullable=True)
    is_completed = Column(Boolean, default=False)
    time_taken = Column(Integer, nullable=True)  # seconds

    # Relationships
    quiz = relationship("Quiz", back_populates="attempts")
    student = relationship("User", foreign_keys=[student_id])
    answers = relationship("StudentQuizAnswer", back_populates="attempt", cascade="all, delete-orphan")

class StudentQuizAnswer(Base):
    __tablename__ = "student_quiz_answers"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("student_quiz_attempts.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("quiz_questions.id"), nullable=False)
    answer_given = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    points_earned = Column(Float, nullable=True)
    answered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    attempt = relationship("StudentQuizAttempt", back_populates="answers")
    question = relationship("QuizQuestion")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    answer_given = Column(String(500))
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    user = relationship("User", back_populates="quiz_attempts")
    question = relationship("Question", back_populates="quiz_attempts")



class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic = Column(String(100), nullable=False)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    last_activity = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    streak_days = Column(Integer, default=0)
    best_streak = Column(Integer, default=0)

    # Indexes for efficient queries
    __table_args__ = (
        {'extend_existing': True}
    )

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_type = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    icon = Column(String(50))
    earned_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AIInteraction(Base):
    __tablename__ = "ai_interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    has_code = Column(Boolean, default=False)
    has_chart = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    rating = Column(Integer)  # User feedback on response quality

class PDFDocument(Base):
    __tablename__ = "pdf_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    content_text = Column(Text, nullable=False)  # Extracted text from PDF
    summary = Column(Text)  # AI-generated summary
    upload_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    user = relationship("User", back_populates="pdf_uploads")
    chat_sessions = relationship("ChatSession", back_populates="pdf_document")

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pdf_document_id = Column(Integer, ForeignKey("pdf_documents.id"), nullable=True)
    session_name = Column(String(255))  # Optional name for the session
    created_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    last_activity = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    pdf_document = relationship("PDFDocument", back_populates="chat_sessions")
    chat_messages = relationship("ChatMessage", back_populates="chat_session")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message_type = Column(String(20), nullable=False)  # 'user' or 'ai'
    content = Column(Text, nullable=False)
    has_code = Column(Boolean, default=False)
    has_chart = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    chat_session = relationship("ChatSession", back_populates="chat_messages")

# ============================================================================
# MasterLMS Academic Structure Models
# ============================================================================

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(10), nullable=False, unique=True)  # e.g., "CS", "MATH"
    description = Column(Text, nullable=True)
    head_of_department_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    programs = relationship("Program", back_populates="department")
    courses = relationship("Course", back_populates="department")
    lecturers = relationship("User", foreign_keys="User.department_id", backref="department")

class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=False, unique=True)  # e.g., "CS-BS", "MATH-MS"
    program_type = Column(Enum(ProgramType, values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    duration_years = Column(Integer, nullable=False, default=4)
    total_credits = Column(Integer, nullable=False, default=120)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    department = relationship("Department", back_populates="programs")
    enrollments = relationship("Enrollment", back_populates="program")
    lecturer_assignments = relationship("ProgramLecturer", back_populates="program")
    course_allocations = relationship("ProgramCourse", back_populates="program")

class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)  # e.g., "Fall 2024"
    semester_type = Column(Enum(SemesterType), nullable=False)
    year = Column(Integer, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    registration_start = Column(DateTime, nullable=False)
    registration_end = Column(DateTime, nullable=False)
    is_current = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    courses = relationship("Course", back_populates="semester")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), nullable=False)  # e.g., "CS101"
    description = Column(Text, nullable=True)
    credits = Column(Integer, nullable=False, default=3)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    lecturer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    max_capacity = Column(Integer, nullable=False, default=30)
    prerequisites = Column(JSON, nullable=True)  # List of course IDs
    syllabus = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    department = relationship("Department", back_populates="courses")
    lecturer = relationship("User", back_populates="lecturer_courses")
    semester = relationship("Semester", back_populates="courses")
    enrollments = relationship("Enrollment", back_populates="course")
    assignments = relationship("Assignment", back_populates="course")
    course_materials = relationship("CourseMaterial", back_populates="course")
    lessons = relationship("Lesson", back_populates="course")
    forums = relationship("DiscussionForum", back_populates="course")
    quizzes = relationship("Quiz", back_populates="course")
    program_allocations = relationship("ProgramCourse", back_populates="course")

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    enrollment_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    status = Column(Enum(EnrollmentStatus), default=EnrollmentStatus.ENROLLED)
    final_grade = Column(String(5), nullable=True)  # A, B, C, D, F
    grade_points = Column(Float, nullable=True)  # 4.0 scale
    attendance_percentage = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)

    # Relationships
    student = relationship("User", foreign_keys=[student_id], back_populates="student_enrollments")
    course = relationship("Course", back_populates="enrollments")
    program = relationship("Program", back_populates="enrollments")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    due_date = Column(DateTime, nullable=False)
    max_points = Column(Float, nullable=False, default=100.0)
    assignment_type = Column(String(50), default="homework")  # homework, quiz, exam, project
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    course = relationship("Course", back_populates="assignments")
    submissions = relationship("AssignmentSubmission", back_populates="assignment")

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    submission_text = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(255), nullable=True)
    file_url = Column(String(500), nullable=True)
    comments = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    grade = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    is_late = Column(Boolean, default=False)
    graded_at = Column(DateTime, nullable=True)
    graded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", foreign_keys=[student_id])
    graded_by = relationship("User", foreign_keys=[graded_by_id])

class CourseMaterial(Base):
    __tablename__ = "course_materials"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True)  # Optional lesson association
    file_name = Column(String(255), nullable=True)
    file_path = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String(100), nullable=True)
    material_type = Column(String(50), default="document")  # document, video, link, pdf
    is_published = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    uploaded_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    upload_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    course = relationship("Course", back_populates="course_materials")
    lesson = relationship("Lesson", back_populates="materials")
    uploaded_by = relationship("User")

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    lesson_date = Column(DateTime, nullable=True)
    lesson_time = Column(String(10), nullable=True)  # e.g., "14:30"
    duration_minutes = Column(Integer, default=60)
    lesson_type = Column(String(50), default="lecture")  # lecture, lab, tutorial, seminar, workshop
    lesson_order = Column(Integer, default=1)  # Order within course
    is_published = Column(Boolean, default=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    course = relationship("Course", back_populates="lessons")
    materials = relationship("CourseMaterial", back_populates="lesson")
    created_by = relationship("User")

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_audience = Column(String(50), default="all")  # all, students, lecturers, parents, course
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)  # For course-specific announcements
    is_published = Column(Boolean, default=True)
    is_urgent = Column(Boolean, default=False)
    publish_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    author = relationship("User")
    course = relationship("Course")

class GradeReport(Base):
    __tablename__ = "grade_reports"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id"), nullable=False)
    gpa = Column(Float, nullable=True)
    total_credits = Column(Integer, default=0)
    credits_earned = Column(Integer, default=0)
    academic_standing = Column(String(50), default="good")  # good, probation, suspension
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# ============================================================================
# Communication Models
# ============================================================================

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    parent_message_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
    parent_message = relationship("Message", remote_side=[id])
    replies = relationship("Message", back_populates="parent_message")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False)  # announcement, message, grade, etc.
    related_id = Column(Integer, nullable=True)  # ID of related object
    is_read = Column(Boolean, default=False)
    is_urgent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="notifications")

# ============================================================================
# Discussion Forum Models
# ============================================================================

class DiscussionForum(Base):
    __tablename__ = "discussion_forums"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_pinned = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    course = relationship("Course", back_populates="forums")
    created_by = relationship("User")
    threads = relationship("DiscussionThread", back_populates="forum")

class DiscussionThread(Base):
    __tablename__ = "discussion_threads"

    id = Column(Integer, primary_key=True, index=True)
    forum_id = Column(Integer, ForeignKey("discussion_forums.id"), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    view_count = Column(Integer, default=0)
    is_pinned = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    last_activity = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    forum = relationship("DiscussionForum", back_populates="threads")
    author = relationship("User")
    posts = relationship("DiscussionPost", back_populates="thread")

class DiscussionPost(Base):
    __tablename__ = "discussion_posts"

    id = Column(Integer, primary_key=True, index=True)
    thread_id = Column(Integer, ForeignKey("discussion_threads.id"), nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_post_id = Column(Integer, ForeignKey("discussion_posts.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    thread = relationship("DiscussionThread", back_populates="posts")
    author = relationship("User")
    parent_post = relationship("DiscussionPost", remote_side=[id])
    replies = relationship("DiscussionPost", back_populates="parent_post")

class ProgramLecturer(Base):
    __tablename__ = "program_lecturers"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    lecturer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin who assigned
    is_active = Column(Boolean, default=True)
    role = Column(String(50), default="lecturer")  # lecturer, coordinator, advisor

    # Relationships
    program = relationship("Program", back_populates="lecturer_assignments")
    lecturer = relationship("User", foreign_keys=[lecturer_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])

    # Unique constraint to prevent duplicate assignments
    __table_args__ = (
        UniqueConstraint('program_id', 'lecturer_id', name='unique_program_lecturer'),
    )

class ProgramCourse(Base):
    __tablename__ = "program_courses"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    is_required = Column(Boolean, default=True)  # Whether this course is required for the program
    semester_order = Column(Integer, default=1)  # Which semester this course should be taken
    allocated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    allocated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin who allocated
    is_active = Column(Boolean, default=True)

    # Relationships
    program = relationship("Program", back_populates="course_allocations")
    course = relationship("Course", back_populates="program_allocations")
    allocated_by = relationship("User", foreign_keys=[allocated_by_id])

    # Unique constraint to prevent duplicate allocations
    __table_args__ = (
        UniqueConstraint('program_id', 'course_id', name='unique_program_course'),
    )
