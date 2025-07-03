"""
Academic Service for MasterLMS
Handles academic operations like departments, programs, courses, enrollments
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timezone

from models import (
    Department, Program, Course, Semester, SemesterType, Enrollment, User, UserRole,
    EnrollmentStatus, Assignment, CourseMaterial, GradeReport, ProgramLecturer
)

class AcademicService:
    def __init__(self):
        pass

    def _is_lecturer(self, user):
        """Helper method to check if user is a lecturer"""
        if hasattr(user.role, 'value'):
            return user.role.value == "lecturer"
        elif hasattr(user, 'role'):
            return user.role == UserRole.LECTURER or str(user.role).lower() == "lecturer"
        return False

    # ============================================================================
    # Department Management
    # ============================================================================

    def get_departments(self, db: Session, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get all departments"""
        query = db.query(Department)
        if active_only:
            query = query.filter(Department.is_active == True)

        departments = query.order_by(Department.name).all()

        result = []
        for dept in departments:
            # Get lecturers count for this department
            lecturers_count = db.query(User).filter(
                User.department_id == dept.id,
                User.role == UserRole.LECTURER,
                User.is_active == True
            ).count()

            result.append({
                "id": dept.id,
                "name": dept.name,
                "code": dept.code,
                "description": dept.description,
                "head_name": None,  # Will be populated from head_of_department_id if needed
                "is_active": dept.is_active,
                "created_at": dept.created_at.isoformat(),
                "total_programs": len([p for p in dept.programs if p.is_active]),
                "total_courses": len([c for c in dept.courses if c.is_active]),
                "total_students": len(set([e.student_id for c in dept.courses for e in c.enrollments if e.status == EnrollmentStatus.ENROLLED])),
                "total_lecturers": lecturers_count
            })

        return result

    def create_department(self, db: Session, data: dict) -> Dict[str, Any]:
        """Create a new department"""
        # Check if department code already exists (only among active departments)
        existing = db.query(Department).filter(
            Department.code == data["code"].upper(),
            Department.is_active == True
        ).first()
        if existing:
            raise ValueError(f"Department code '{data['code'].upper()}' already exists in active departments")

        department = Department(
            name=data["name"],
            code=data["code"].upper(),
            description=data["description"],
            is_active=data.get("is_active", True)
        )

        db.add(department)
        db.commit()
        db.refresh(department)

        return {
            "id": department.id,
            "name": department.name,
            "code": department.code,
            "description": department.description,
            "head_name": None,
            "is_active": department.is_active,
            "created_at": department.created_at.isoformat()
        }

    def update_department(self, db: Session, department_id: int, data: dict) -> Dict[str, Any]:
        """Update an existing department"""
        department = db.query(Department).filter(Department.id == department_id).first()
        if not department:
            raise ValueError("Department not found")

        # Check if new code conflicts with existing departments
        if "code" in data and data["code"].upper() != department.code:
            existing = db.query(Department).filter(
                Department.code == data["code"].upper(),
                Department.id != department_id
            ).first()
            if existing:
                raise ValueError("Department code already exists")

        # Update fields
        if "name" in data:
            department.name = data["name"]
        if "code" in data:
            department.code = data["code"].upper()
        if "description" in data:
            department.description = data["description"]
        if "is_active" in data:
            department.is_active = data["is_active"]

        db.commit()
        db.refresh(department)

        return {
            "id": department.id,
            "name": department.name,
            "code": department.code,
            "description": department.description,
            "head_name": None,
            "is_active": department.is_active,
            "created_at": department.created_at.isoformat()
        }

    def can_delete_department(self, db: Session, department_id: int) -> Dict[str, Any]:
        """Check if a department can be safely deleted"""
        department = db.query(Department).filter(Department.id == department_id).first()
        if not department:
            return {"can_delete": False, "reason": "Department not found"}

        # Check if department has active programs or courses
        active_programs = db.query(Program).filter(
            Program.department_id == department_id,
            Program.is_active == True
        ).count()

        active_courses = db.query(Course).filter(
            Course.department_id == department_id,
            Course.is_active == True
        ).count()

        if active_programs > 0 or active_courses > 0:
            return {
                "can_delete": False,
                "reason": f"Department has {active_programs} active program(s) and {active_courses} active course(s)",
                "active_programs": active_programs,
                "active_courses": active_courses
            }

        return {"can_delete": True, "reason": "Department can be safely deleted"}

    def delete_department(self, db: Session, department_id: int, force: bool = False) -> None:
        """Delete a department (soft delete by setting is_active to False)"""
        department = db.query(Department).filter(Department.id == department_id).first()
        if not department:
            raise ValueError("Department not found")

        if not force:
            # Check if department has active programs or courses
            active_programs = db.query(Program).filter(
                Program.department_id == department_id,
                Program.is_active == True
            ).count()

            active_courses = db.query(Course).filter(
                Course.department_id == department_id,
                Course.is_active == True
            ).count()

            if active_programs > 0 or active_courses > 0:
                error_msg = f"Cannot delete department. It has {active_programs} active program(s) and {active_courses} active course(s). Please deactivate or move them first."
                raise ValueError(error_msg)
        else:
            # Force delete: deactivate all related programs and courses first
            # Deactivate all programs in this department
            programs = db.query(Program).filter(Program.department_id == department_id).all()
            for program in programs:
                program.is_active = False

            # Deactivate all courses in this department
            courses = db.query(Course).filter(Course.department_id == department_id).all()
            for course in courses:
                course.is_active = False

            # Unassign all lecturers from this department
            lecturers = db.query(User).filter(User.department_id == department_id).all()
            for lecturer in lecturers:
                lecturer.department_id = None

        department.is_active = False
        db.commit()

    def get_department_details(self, db: Session, department_id: int) -> Dict[str, Any]:
        """Get detailed department information including lecturers"""
        department = db.query(Department).filter(Department.id == department_id).first()
        if not department:
            raise ValueError("Department not found")

        # Get lecturers in this department
        lecturers = db.query(User).filter(
            User.department_id == department_id,
            User.role == UserRole.LECTURER,
            User.is_active == True
        ).all()

        # Get programs and courses
        programs = [p for p in department.programs if p.is_active]
        courses = [c for c in department.courses if c.is_active]

        return {
            "id": department.id,
            "name": department.name,
            "code": department.code,
            "description": department.description,
            "is_active": department.is_active,
            "created_at": department.created_at.isoformat(),
            "lecturers": [
                {
                    "id": lecturer.id,
                    "name": lecturer.name,
                    "email": lecturer.email,
                    "employee_id": lecturer.employee_id,
                    "is_active": lecturer.is_active
                }
                for lecturer in lecturers
            ],
            "programs": [
                {
                    "id": program.id,
                    "name": program.name,
                    "code": program.code,
                    "program_type": program.program_type.value
                }
                for program in programs
            ],
            "courses": [
                {
                    "id": course.id,
                    "name": course.name,
                    "code": course.code,
                    "lecturer_name": course.lecturer.name if course.lecturer else "TBA"
                }
                for course in courses
            ],
            "statistics": {
                "total_lecturers": len(lecturers),
                "total_programs": len(programs),
                "total_courses": len(courses),
                "total_students": len(set([e.student_id for c in courses for e in c.enrollments if e.status == EnrollmentStatus.ENROLLED]))
            }
        }

    def assign_lecturer_to_department(self, db: Session, lecturer_id: int, department_id: int) -> Dict[str, Any]:
        """Assign a lecturer to a department"""
        lecturer = db.query(User).filter(
            User.id == lecturer_id,
            User.role == UserRole.LECTURER
        ).first()

        if not lecturer:
            raise ValueError("Lecturer not found")

        department = db.query(Department).filter(Department.id == department_id).first()
        if not department:
            raise ValueError("Department not found")

        lecturer.department_id = department_id
        db.commit()
        db.refresh(lecturer)

        return {
            "message": f"Lecturer {lecturer.name} assigned to {department.name} department",
            "lecturer": {
                "id": lecturer.id,
                "name": lecturer.name,
                "email": lecturer.email
            },
            "department": {
                "id": department.id,
                "name": department.name,
                "code": department.code
            }
        }

    # ============================================================================
    # Program Management
    # ============================================================================

    def get_programs(self, db: Session, department_id: int = None, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get academic programs, optionally filtered by department"""
        query = db.query(Program)

        if active_only:
            query = query.filter(Program.is_active == True)

        if department_id:
            query = query.filter(Program.department_id == department_id)

        programs = query.order_by(Program.name).all()

        result = []
        for program in programs:
            # Get courses count from the same department (since courses belong to departments, not programs directly)
            department_courses = db.query(Course).filter(
                Course.department_id == program.department_id,
                Course.is_active == True
            ).count()

            result.append({
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
                "total_courses": department_courses,  # Courses in the same department
                "enrolled_students": len(set([e.student_id for e in program.enrollments if e.status == EnrollmentStatus.ENROLLED]))
            })

        return result

    def create_program(self, db: Session, data: dict) -> Dict[str, Any]:
        """Create a new program"""
        # Check if program code already exists (only among active programs)
        existing = db.query(Program).filter(
            Program.code == data["code"].upper(),
            Program.is_active == True
        ).first()
        if existing:
            raise ValueError(f"Program code '{data['code'].upper()}' already exists in active programs")

        # Verify department exists
        department = db.query(Department).filter(Department.id == data["department_id"]).first()
        if not department:
            raise ValueError("Department not found")

        program = Program(
            name=data["name"],
            code=data["code"].upper(),
            description=data["description"],
            program_type=data["program_type"],
            department_id=data["department_id"],
            duration_years=data.get("duration_years", 4),
            total_credits=data.get("total_credits", 120),
            is_active=data.get("is_active", True)
        )

        db.add(program)
        db.commit()
        db.refresh(program)

        return {
            "id": program.id,
            "name": program.name,
            "code": program.code,
            "description": program.description,
            "program_type": program.program_type.value if hasattr(program.program_type, 'value') else str(program.program_type),
            "department_id": program.department_id,
            "duration_years": program.duration_years,
            "total_credits": program.total_credits,
            "is_active": program.is_active,
            "created_at": program.created_at.isoformat()
        }

    def update_program(self, db: Session, program_id: int, data: dict) -> Dict[str, Any]:
        """Update an existing program"""
        program = db.query(Program).filter(Program.id == program_id).first()
        if not program:
            raise ValueError("Program not found")

        # Check if new code conflicts with existing programs
        if "code" in data and data["code"].upper() != program.code:
            existing = db.query(Program).filter(
                Program.code == data["code"].upper(),
                Program.id != program_id
            ).first()
            if existing:
                raise ValueError("Program code already exists")

        # Update fields with proper type conversion
        if "name" in data:
            program.name = str(data["name"])
        if "code" in data:
            program.code = str(data["code"]).upper()
        if "description" in data:
            program.description = str(data["description"])
        if "program_type" in data:
            program.program_type = str(data["program_type"])
        if "department_id" in data:
            program.department_id = int(data["department_id"])
        if "duration_years" in data:
            program.duration_years = int(data["duration_years"])
        if "total_credits" in data:
            program.total_credits = int(data["total_credits"])
        if "is_active" in data:
            program.is_active = bool(data["is_active"])

        # Handle lecturer assignment
        if "lecturers" in data and isinstance(data["lecturers"], list):
            # Clear existing lecturer assignments for this program
            existing_assignments = db.query(ProgramLecturer).filter(
                ProgramLecturer.program_id == program_id
            ).all()
            for assignment in existing_assignments:
                assignment.is_active = False

            # Create new assignments
            lecturer_ids = [int(lect_id) for lect_id in data["lecturers"] if lect_id]
            for lecturer_id in lecturer_ids:
                # Check if lecturer exists
                lecturer = db.query(User).filter(
                    User.id == lecturer_id,
                    User.role == UserRole.LECTURER
                ).first()
                if lecturer:
                    # Create new assignment
                    assignment = ProgramLecturer(
                        program_id=program_id,
                        lecturer_id=lecturer_id,
                        role="lecturer"
                    )
                    db.add(assignment)

        db.commit()
        db.refresh(program)

        return {
            "id": program.id,
            "name": program.name,
            "code": program.code,
            "description": program.description,
            "program_type": program.program_type.value if hasattr(program.program_type, 'value') else str(program.program_type),
            "department_id": program.department_id,
            "duration_years": program.duration_years,
            "total_credits": program.total_credits,
            "is_active": program.is_active,
            "created_at": program.created_at.isoformat()
        }

    def delete_program(self, db: Session, program_id: int, force: bool = False) -> None:
        """Delete a program (soft delete by setting is_active to False)"""
        program = db.query(Program).filter(Program.id == program_id).first()
        if not program:
            raise ValueError("Program not found")

        if not force:
            # Check if program has active enrollments
            active_enrollments = db.query(Enrollment).filter(
                Enrollment.program_id == program_id,
                Enrollment.status == EnrollmentStatus.ENROLLED
            ).count()

            if active_enrollments > 0:
                raise ValueError("Cannot delete program with active enrollments")
        else:
            # Force delete: deactivate all enrollments in this program
            enrollments = db.query(Enrollment).filter(Enrollment.program_id == program_id).all()
            for enrollment in enrollments:
                enrollment.status = EnrollmentStatus.DROPPED
                enrollment.is_active = False

        program.is_active = False
        db.commit()

    # ============================================================================
    # Course Management
    # ============================================================================

    def get_courses(self, db: Session, semester_id: int = None, department_id: int = None,
                   lecturer_id: int = None) -> List[Dict[str, Any]]:
        """Get courses with optional filters"""
        query = db.query(Course).filter(Course.is_active == True)

        if semester_id:
            query = query.filter(Course.semester_id == semester_id)
        if department_id:
            query = query.filter(Course.department_id == department_id)
        if lecturer_id:
            query = query.filter(Course.lecturer_id == lecturer_id)

        courses = query.order_by(Course.code).all()

        return [
            {
                "id": course.id,
                "name": course.name,
                "code": course.code,
                "description": course.description,
                "credits": course.credits,
                "department": course.department.name,
                "department_name": course.department.name,  # Add for consistency
                "department_id": course.department_id,
                "lecturer": course.lecturer.name if course.lecturer else "TBA",
                "lecturer_id": course.lecturer_id,
                "semester": course.semester.name if course.semester else "No Semester",
                "semester_id": course.semester_id,
                "max_capacity": course.max_capacity,
                "enrolled_count": len([e for e in course.enrollments if e.status == EnrollmentStatus.ENROLLED]),
                "available_spots": course.max_capacity - len([e for e in course.enrollments if e.status == EnrollmentStatus.ENROLLED]),
                "is_active": course.is_active,  # Add missing field
                "created_at": course.created_at.isoformat() if course.created_at else None
            }
            for course in courses
        ]

    def get_course_details(self, db: Session, course_id: int, user_id: int = None) -> Dict[str, Any]:
        """Get detailed course information"""
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise ValueError("Course not found")

        # Get enrollment info if user_id provided
        enrollment_info = None
        if user_id:
            enrollment = db.query(Enrollment).filter(
                and_(Enrollment.course_id == course_id, Enrollment.student_id == user_id)
            ).first()
            if enrollment:
                enrollment_info = {
                    "status": enrollment.status.value,
                    "enrollment_date": enrollment.enrollment_date.isoformat(),
                    "final_grade": enrollment.final_grade,
                    "attendance_percentage": enrollment.attendance_percentage
                }

        return {
            "id": course.id,
            "name": course.name,
            "code": course.code,
            "description": course.description,
            "credits": course.credits,
            "department": {
                "id": course.department.id,
                "name": course.department.name,
                "code": course.department.code
            },
            "lecturer": {
                "id": course.lecturer.id,
                "name": course.lecturer.name,
                "email": course.lecturer.email
            } if course.lecturer else None,
            "semester": {
                "id": course.semester.id,
                "name": course.semester.name,
                "year": course.semester.year
            },
            "max_capacity": course.max_capacity,
            "enrolled_count": len([e for e in course.enrollments if e.status == EnrollmentStatus.ENROLLED]),
            "syllabus": course.syllabus,
            "prerequisites": course.prerequisites,
            "enrollment_info": enrollment_info,
            "materials_count": len(course.course_materials),
            "assignments_count": len(course.assignments)
        }

    # ============================================================================
    # Enrollment Management
    # ============================================================================

    def enroll_student(self, db: Session, student_id: int, course_id: int, program_id: int) -> Dict[str, Any]:
        """Enroll a student in a course"""
        # Check if student is already enrolled
        existing_enrollment = db.query(Enrollment).filter(
            and_(Enrollment.student_id == student_id, Enrollment.course_id == course_id)
        ).first()

        if existing_enrollment:
            raise ValueError("Student is already enrolled in this course")

        # Check course capacity
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise ValueError("Course not found")

        enrolled_count = len([e for e in course.enrollments if e.status == EnrollmentStatus.ENROLLED])
        if enrolled_count >= course.max_capacity:
            raise ValueError("Course is at full capacity")

        # Create enrollment
        enrollment = Enrollment(
            student_id=student_id,
            course_id=course_id,
            program_id=program_id,
            status=EnrollmentStatus.ENROLLED
        )

        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)

        return {
            "success": True,
            "id": enrollment.id,
            "message": "Student enrolled successfully",
            "course": course.name,
            "enrollment_date": enrollment.enrollment_date.isoformat()
        }

    def get_student_enrollments(self, db: Session, student_id: int, semester_id: int = None) -> List[Dict[str, Any]]:
        """Get student's enrollments"""
        try:
            # First check if the student exists
            student = db.query(User).filter(User.id == student_id).first()
            if not student:
                print(f"Student with ID {student_id} not found")
                return []
            
            print(f"Found student: {student.name} (ID: {student_id})")
            
            # Build the query
            query = db.query(Enrollment).filter(Enrollment.student_id == student_id)
            
            if semester_id:
                print(f"Filtering by semester_id: {semester_id}")
                query = query.join(Course).filter(Course.semester_id == semester_id)
            
            # Get all enrollments
            enrollments = query.order_by(Enrollment.enrollment_date.desc()).all()
            print(f"Found {len(enrollments)} enrollments for student {student_id}")
            
            result = []
            for enrollment in enrollments:
                try:
                    # Check if course exists
                    if not enrollment.course:
                        print(f"Warning: Course not found for enrollment {enrollment.id}")
                        continue
                    
                    # Check if semester exists
                    semester_name = "Unknown"
                    if enrollment.course.semester:
                        semester_name = enrollment.course.semester.name
                    
                    enrollment_data = {
                        "id": enrollment.id,
                        "course_id": enrollment.course.id,
                        "course_name": enrollment.course.name,
                        "course_code": enrollment.course.code,
                        "course_description": enrollment.course.description or "",
                        "lecturer_name": enrollment.course.lecturer.name if enrollment.course.lecturer else "TBA",
                        "credits": enrollment.course.credits,
                        "semester_name": semester_name,
                        "status": enrollment.status.value,
                        "enrollment_date": enrollment.enrollment_date.isoformat(),
                        "final_grade": enrollment.final_grade,
                        "grade_points": enrollment.grade_points,
                        "attendance_percentage": enrollment.attendance_percentage
                    }
                    result.append(enrollment_data)
                    print(f"Processed enrollment {enrollment.id} for course {enrollment.course.name}")
                    
                except Exception as e:
                    print(f"Error processing enrollment {enrollment.id}: {str(e)}")
                    continue
            
            print(f"Returning {len(result)} processed enrollments")
            return result
            
        except Exception as e:
            print(f"Error in get_student_enrollments: {str(e)}")
            return []

    # ============================================================================
    # Semester Management
    # ============================================================================

    def get_current_semester(self, db: Session) -> Dict[str, Any]:
        """Get the current active semester"""
        semester = db.query(Semester).filter(Semester.is_current == True).first()

        if not semester:
            # Fallback to most recent semester
            semester = db.query(Semester).order_by(Semester.start_date.desc()).first()

        if not semester:
            # Create a default semester if none exists
            from datetime import datetime, timezone, timedelta
            try:
                now = datetime.now(timezone.utc)
                default_semester = Semester(
                    name="Default Semester",
                    semester_type=SemesterType.FALL,
                    year=now.year,
                    start_date=now,
                    end_date=now + timedelta(days=120),
                    registration_start=now - timedelta(days=30),
                    registration_end=now + timedelta(days=14),
                    is_current=True
                )
                db.add(default_semester)
                db.commit()
                db.refresh(default_semester)
                semester = default_semester
            except Exception as e:
                # If semester creation fails, return a mock semester
                return {
                    "id": 1,
                    "name": "Default Semester",
                    "semester_type": "fall",
                    "year": datetime.now().year,
                    "start_date": datetime.now(timezone.utc).isoformat(),
                    "end_date": (datetime.now(timezone.utc) + timedelta(days=120)).isoformat(),
                    "is_current": True,
                    "is_active": True
                }

        return {
            "id": semester.id,
            "name": semester.name,
            "semester_type": semester.semester_type.value,
            "year": semester.year,
            "start_date": semester.start_date.isoformat(),
            "end_date": semester.end_date.isoformat(),
            "registration_start": semester.registration_start.isoformat(),
            "registration_end": semester.registration_end.isoformat(),
            "is_current": semester.is_current,
            "course_count": len(semester.courses)
        }

    def get_semesters(self, db: Session, limit: int = 10) -> List[Dict[str, Any]]:
        """Get list of semesters"""
        semesters = db.query(Semester).order_by(Semester.start_date.desc()).limit(limit).all()

        return [
            {
                "id": semester.id,
                "name": semester.name,
                "semester_type": semester.semester_type.value,
                "year": semester.year,
                "start_date": semester.start_date.isoformat(),
                "end_date": semester.end_date.isoformat(),
                "is_current": semester.is_current,
                "is_active": semester.is_active,
                "course_count": len(semester.courses)
            }
            for semester in semesters
        ]

    # ============================================================================
    # Academic Analytics
    # ============================================================================

    def get_academic_overview(self, db: Session) -> Dict[str, Any]:
        """Get academic system overview statistics"""
        try:
            total_students = db.query(User).filter(User.role == UserRole.STUDENT).count()
            total_lecturers = db.query(User).filter(User.role == UserRole.LECTURER).count()
            total_courses = db.query(Course).filter(Course.is_active == True).count()
            total_departments = db.query(Department).filter(Department.is_active == True).count()
            total_programs = db.query(Program).filter(Program.is_active == True).count()

            current_semester = self.get_current_semester(db)

            # Handle case where semester_id might not exist in courses
            try:
                current_enrollments = db.query(Enrollment).join(Course).filter(
                    Course.semester_id == current_semester["id"],
                    Enrollment.status == EnrollmentStatus.ENROLLED
                ).count()
            except Exception:
                current_enrollments = 0

            return {
                "total_students": total_students,
                "total_lecturers": total_lecturers,
                "total_courses": total_courses,
                "total_departments": total_departments,
                "total_programs": total_programs,
                "current_semester": current_semester["name"],
                "current_enrollments": current_enrollments,
                "system_status": "operational"
            }
        except Exception as e:
            # Return default values if there's any error
            return {
                "total_students": 0,
                "total_lecturers": 0,
                "total_courses": 0,
                "total_departments": 0,
                "total_programs": 0,
                "current_semester": "Default Semester",
                "current_enrollments": 0,
                "system_status": "operational"
            }
