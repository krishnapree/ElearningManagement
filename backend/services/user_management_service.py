"""
User Management Service for MasterLMS
Handles user operations, role management, and user-specific functionality
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timezone

from models import (
    User, UserRole, Enrollment, Course, EnrollmentStatus,
    Assignment, AssignmentSubmission, GradeReport, Announcement
)
from auth import AuthManager

class UserManagementService:
    def __init__(self):
        self.auth_manager = AuthManager()

    # ============================================================================
    # User Management
    # ============================================================================

    def get_all_users(self, db: Session, active_only: bool = False) -> List[Dict[str, Any]]:
        """Get all users"""
        query = db.query(User)

        if active_only:
            query = query.filter(User.is_active == True)

        users = query.order_by(User.name).all()

        return [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role.value,
                "student_id": user.student_id,
                "employee_id": user.employee_id,
                "phone": user.phone,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat(),
                "enrollment_count": self._get_user_enrollment_count(db, user.id) if user.role == UserRole.STUDENT else 0,
                "current_gpa": self._get_user_gpa(db, user.id) if user.role == UserRole.STUDENT else None
            }
            for user in users
        ]

    def get_users_by_role(self, db: Session, role: UserRole, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get users filtered by role"""
        query = db.query(User).filter(User.role == role)

        if active_only:
            query = query.filter(User.is_active == True)

        users = query.order_by(User.name).all()

        return [
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role.value,
                "student_id": user.student_id,
                "employee_id": user.employee_id,
                "phone": user.phone,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat(),
                "enrollment_count": self._get_user_enrollment_count(db, user.id) if role == UserRole.STUDENT else 0,
                "current_gpa": self._get_user_gpa(db, user.id) if role == UserRole.STUDENT else None
            }
            for user in users
        ]

    def get_lecturer_students(self, db: Session, lecturer_id: int) -> List[Dict[str, Any]]:
        """Get all students enrolled in lecturer's courses"""
        from models import Course, Enrollment

        # Get all courses taught by this lecturer
        lecturer_courses = db.query(Course).filter(Course.lecturer_id == lecturer_id).all()
        course_ids = [course.id for course in lecturer_courses]

        if not course_ids:
            return []

        # Get all students enrolled in these courses
        enrollments = db.query(Enrollment).filter(
            Enrollment.course_id.in_(course_ids),
            Enrollment.status == "enrolled"
        ).all()

        # Get unique student IDs
        student_ids = list(set([enrollment.student_id for enrollment in enrollments]))

        if not student_ids:
            return []

        # Get student details
        students = db.query(User).filter(
            User.id.in_(student_ids),
            User.role == UserRole.STUDENT,
            User.is_active == True
        ).order_by(User.name).all()

        return [
            {
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "role": student.role.value,
                "student_id": student.student_id,
                "employee_id": student.employee_id,
                "phone": student.phone,
                "is_active": student.is_active,
                "created_at": student.created_at.isoformat(),
                "enrollment_count": self._get_user_enrollment_count(db, student.id),
                "current_gpa": self._get_user_gpa(db, student.id)
            }
            for student in students
        ]

    def get_user_profile(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get detailed user profile"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        profile = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value,
            "student_id": user.student_id,
            "employee_id": user.employee_id,
            "phone": user.phone,
            "address": user.address,
            "date_of_birth": user.date_of_birth.isoformat() if user.date_of_birth else None,
            "profile_picture": user.profile_picture,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
            "subscription_status": user.subscription_status
        }

        # Add role-specific information
        if user.role == UserRole.STUDENT:
            profile.update(self._get_student_specific_info(db, user_id))
        elif user.role == UserRole.LECTURER:
            profile.update(self._get_lecturer_specific_info(db, user_id))

        elif user.role == UserRole.ADMIN:
            profile.update(self._get_admin_specific_info(db, user_id))

        return profile

    def _get_student_specific_info(self, db: Session, student_id: int) -> Dict[str, Any]:
        """Get student-specific information"""
        # Get current enrollments
        current_enrollments = db.query(Enrollment).join(Course).filter(
            Enrollment.student_id == student_id,
            Enrollment.is_active == True
        ).count()

        # Get GPA (latest grade report)
        latest_grade_report = db.query(GradeReport).filter(
            GradeReport.student_id == student_id
        ).order_by(GradeReport.generated_at.desc()).first()

        return {
            "current_enrollments": current_enrollments,
            "gpa": latest_grade_report.gpa if latest_grade_report else None,
            "academic_standing": latest_grade_report.academic_standing if latest_grade_report else "good",
            "total_credits_earned": latest_grade_report.credits_earned if latest_grade_report else 0
        }

    def _get_lecturer_specific_info(self, db: Session, lecturer_id: int) -> Dict[str, Any]:
        """Get lecturer-specific information"""
        # Get courses taught
        courses_taught = db.query(Course).filter(
            Course.lecturer_id == lecturer_id,
            Course.is_active == True
        ).count()

        # Get total students across all courses
        total_students = db.query(Enrollment).join(Course).filter(
            Course.lecturer_id == lecturer_id,
            Enrollment.status.in_(['enrolled', 'completed'])
        ).count()

        return {
            "courses_taught": courses_taught,
            "total_students": total_students,
            "department_affiliation": "Computer Science"  # This could be dynamic
        }



    def _get_admin_specific_info(self, db: Session, admin_id: int) -> Dict[str, Any]:
        """Get admin-specific information"""
        return {
            "admin_level": "system",
            "permissions": ["full_access"]
        }

    # ============================================================================
    # Student-Specific Operations
    # ============================================================================

    def get_student_dashboard(self, db: Session, student_id: int) -> Dict[str, Any]:
        """Get student dashboard data"""
        from services.academic_service import AcademicService
        academic_service = AcademicService()

        # Get current semester
        current_semester = academic_service.get_current_semester(db)

        # Get current enrollments with proper structure
        enrollments_data = academic_service.get_student_enrollments(db, student_id)
        
        # Transform enrollments to match frontend expectations
        enrollments = []
        for enrollment in enrollments_data:
            enrollments.append({
                "id": enrollment["id"],
                "course": {
                    "id": enrollment["course_id"],
                    "name": enrollment["course_name"],
                    "code": enrollment["course_code"],
                    "credits": enrollment["credits"],
                    "lecturer": enrollment["lecturer_name"]
                },
                "status": enrollment["status"],
                "final_grade": enrollment.get("final_grade"),
                "attendance_percentage": enrollment.get("attendance_percentage")
            })

        # Get upcoming assignments
        upcoming_assignments = self._get_upcoming_assignments(db, student_id)

        # Get academic progress
        academic_progress = self._get_academic_progress(db, student_id)

        return {
            "current_semester": {
                "id": current_semester["id"],
                "name": current_semester["name"],
                "year": current_semester["year"]
            },
            "enrollments": enrollments,
            "upcoming_assignments": upcoming_assignments,
            "academic_progress": {
                "gpa": academic_progress.get("current_gpa"),
                "total_credits": academic_progress.get("total_credits", 0),
                "credits_earned": academic_progress.get("credits_earned", 0),
                "completion_percentage": academic_progress.get("completion_percentage", 0)
            },
            "total_courses": len(enrollments),
            "completed_assignments": self._get_completed_assignments_count(db, student_id)
        }

    def _get_upcoming_assignments(self, db: Session, student_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        """Get upcoming assignments for a student"""
        from models import Assignment, Enrollment
        from datetime import datetime, timezone

        # Get assignments from enrolled courses
        assignments = db.query(Assignment).join(
            Enrollment, Assignment.course_id == Enrollment.course_id
        ).filter(
            Enrollment.student_id == student_id,
            Enrollment.status == EnrollmentStatus.ENROLLED,
            Assignment.due_date > datetime.now(timezone.utc),
            Assignment.is_published == True
        ).order_by(Assignment.due_date).limit(limit).all()

        return [
            {
                "id": assignment.id,
                "title": assignment.title,
                "course": assignment.course.name if assignment.course else "Unknown Course",
                "course_code": assignment.course.code if assignment.course else "UNK",
                "due_date": assignment.due_date.isoformat(),
                "max_points": assignment.max_points,
                "days_until_due": (assignment.due_date - datetime.now(timezone.utc)).days
            }
            for assignment in assignments
        ]

    def _get_student_announcements(self, db: Session, student_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        """Get recent announcements for a student"""
        # Get student's enrolled courses
        enrolled_courses = db.query(Course).join(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.status == 'enrolled'
        ).all()

        course_ids = [course.id for course in enrolled_courses]

        # Get announcements (general + course-specific)
        announcements = db.query(Announcement).filter(
            and_(
                Announcement.is_published == True,
                or_(
                    Announcement.target_audience == 'all',
                    Announcement.target_audience == 'students',
                    Announcement.course_id.in_(course_ids)
                )
            )
        ).order_by(Announcement.created_at.desc()).limit(limit).all()

        return [
            {
                "id": announcement.id,
                "title": announcement.title,
                "content": announcement.content[:200] + "..." if len(announcement.content) > 200 else announcement.content,
                "author": announcement.author.name if hasattr(announcement, 'author') else "System",
                "course": announcement.course.name if announcement.course else None,
                "created_at": announcement.created_at.isoformat(),
                "target_audience": announcement.target_audience
            }
            for announcement in announcements
        ]

    def _get_academic_progress(self, db: Session, student_id: int) -> Dict[str, Any]:
        """Get academic progress for a student"""
        from models import Enrollment

        # Get enrollment statistics
        total_enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == student_id
        ).count()

        completed_courses = db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.status == EnrollmentStatus.COMPLETED
        ).count()

        # Calculate average grade
        enrollments_with_grades = db.query(Enrollment).filter(
            Enrollment.student_id == student_id,
            Enrollment.final_grade.isnot(None)
        ).all()

        avg_grade = None
        if enrollments_with_grades:
            total_grade = sum(e.final_grade for e in enrollments_with_grades if e.final_grade)
            avg_grade = total_grade / len(enrollments_with_grades) if enrollments_with_grades else None

        # Calculate completion percentage
        completion_percentage = (completed_courses / total_enrollments * 100) if total_enrollments > 0 else 0

        return {
            "current_gpa": avg_grade,
            "total_credits": total_enrollments * 3,  # Assuming 3 credits per course
            "credits_earned": completed_courses * 3,  # Assuming 3 credits per course
            "completion_percentage": completion_percentage
        }

    def _get_completed_assignments_count(self, db: Session, student_id: int) -> int:
        """Get count of completed assignments"""
        return db.query(AssignmentSubmission).filter(
            AssignmentSubmission.student_id == student_id
        ).count()

    # ============================================================================
    # Lecturer-Specific Operations
    # ============================================================================

    def get_lecturer_dashboard(self, db: Session, lecturer_id: int) -> Dict[str, Any]:
        """Get lecturer dashboard data"""
        from services.academic_service import AcademicService
        academic_service = AcademicService()

        # Get current semester
        current_semester = academic_service.get_current_semester(db)

        # Get lecturer's courses
        courses = academic_service.get_courses(db, semester_id=current_semester["id"], lecturer_id=lecturer_id)

        # Get pending submissions
        pending_submissions = self._get_pending_submissions(db, lecturer_id)

        # Get course statistics
        course_stats = self._get_lecturer_course_stats(db, lecturer_id)

        return {
            "current_semester": current_semester,
            "courses": courses,
            "pending_submissions": pending_submissions,
            "course_statistics": course_stats,
            "total_courses": len(courses),
            "total_students": sum(course["enrolled_count"] for course in courses)
        }

    def _get_pending_submissions(self, db: Session, lecturer_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Get pending assignment submissions for lecturer's courses"""
        # Get lecturer's courses
        lecturer_courses = db.query(Course).filter(
            Course.lecturer_id == lecturer_id,
            Course.is_active == True
        ).all()

        course_ids = [course.id for course in lecturer_courses]

        # Get assignments with pending submissions
        pending_submissions = db.query(AssignmentSubmission).join(Assignment).filter(
            Assignment.course_id.in_(course_ids),
            AssignmentSubmission.grade.is_(None)
        ).order_by(AssignmentSubmission.submitted_at.desc()).limit(limit).all()

        return [
            {
                "id": submission.id,
                "assignment": submission.assignment.title,
                "student": submission.student.name if hasattr(submission, 'student') else "Unknown",
                "course": submission.assignment.course.name,
                "submitted_at": submission.submitted_at.isoformat(),
                "is_late": submission.is_late,
                "days_since_submission": (datetime.now(timezone.utc) - submission.submitted_at).days
            }
            for submission in pending_submissions
        ]

    def _get_lecturer_course_stats(self, db: Session, lecturer_id: int) -> Dict[str, Any]:
        """Get statistics for lecturer's courses"""
        # Get lecturer's courses
        lecturer_courses = db.query(Course).filter(
            Course.lecturer_id == lecturer_id,
            Course.is_active == True
        ).all()

        total_students = 0
        total_assignments = 0

        for course in lecturer_courses:
            total_students += len([e for e in course.enrollments if e.status == 'enrolled'])
            total_assignments += len(course.assignments)

        return {
            "total_courses": len(lecturer_courses),
            "total_students": total_students,
            "total_assignments": total_assignments,
            "average_class_size": total_students / len(lecturer_courses) if lecturer_courses else 0
        }

    # ============================================================================
    # Helper Methods
    # ============================================================================

    def _get_user_enrollment_count(self, db: Session, user_id: int) -> int:
        """Get enrollment count for a user (students only)"""
        return db.query(Enrollment).filter(
            Enrollment.student_id == user_id,
            Enrollment.status == 'enrolled'
        ).count()

    def _get_user_gpa(self, db: Session, user_id: int) -> Optional[float]:
        """Get current GPA for a user (students only)"""
        # For now, return None - this can be enhanced later with actual GPA calculation
        return None

    def _get_student_announcements(self, db: Session, student_id: int) -> List[Dict[str, Any]]:
        """Get recent announcements for a student"""
        # For now, return empty list - this can be enhanced later with actual announcements
        return []

    def update_user(self, db: Session, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update user information"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Update allowed fields
        allowed_fields = ['name', 'email', 'phone', 'address', 'is_active', 'student_id', 'employee_id']

        for field in allowed_fields:
            if field in data:
                setattr(user, field, data[field])

        # Handle role update if provided
        if 'role' in data:
            try:
                role_value = data['role']
                if isinstance(role_value, str):
                    # Map string values to enum values
                    role_mapping = {
                        'admin': UserRole.ADMIN,
                        'lecturer': UserRole.LECTURER,
                        'student': UserRole.STUDENT
                    }
                    if role_value.lower() in role_mapping:
                        user.role = role_mapping[role_value.lower()]
                    else:
                        raise ValueError(f"Invalid role: {role_value}")
                else:
                    user.role = role_value
            except (ValueError, AttributeError) as e:
                raise ValueError(f"Invalid role: {data['role']} - {str(e)}")

        db.commit()
        db.refresh(user)

        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value,
            "student_id": user.student_id,
            "employee_id": user.employee_id,
            "phone": user.phone,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat()
        }

    def get_user_by_id(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get user details by ID"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
            "student_id": user.student_id,
            "employee_id": user.employee_id,
            "phone": user.phone,
            "address": user.address,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "department_id": user.department_id
        }

    def activate_user(self, db: Session, user_id: int) -> bool:
        """Activate a user"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        user.is_active = True
        db.commit()
        return True

    def deactivate_user(self, db: Session, user_id: int) -> bool:
        """Deactivate a user"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        user.is_active = False
        db.commit()
        return True

    def delete_user(self, db: Session, user_id: int) -> bool:
        """Delete a user (soft delete by setting is_active to False)"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Soft delete - set is_active to False instead of actually deleting
        user.is_active = False
        db.commit()

        return True
