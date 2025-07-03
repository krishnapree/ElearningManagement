"""
Fresh seed data for LMS database
Creates a clean, consistent dataset for testing and development
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from models import (
    User, UserRole, Department, Program, ProgramType, Course, Semester, SemesterType,
    Enrollment, EnrollmentStatus
)
from auth import AuthManager
from datetime import datetime, timezone, timedelta
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_fresh_seed_data():
    """Create fresh seed data for the LMS system"""

    print("🌱 Creating fresh seed data for LMS...")

    # Get database session and auth manager
    db = next(get_db())
    auth_manager = AuthManager()

    try:
        # Clear any existing data (optional - since we're using a fresh DB)
        print("📝 Starting with fresh database...")
        
        # ============================================================================
        # 1. CREATE USERS
        # ============================================================================
        print("👥 Creating users...")
        
        # Create Admin User
        admin = User(
            name="System Administrator",
            email="admin@lms.edu",
            password_hash=auth_manager.hash_password("admin123"),
            role=UserRole.ADMIN,
            employee_id="ADM001",
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        db.add(admin)
        
        # Create Lecturers
        lecturers = [
            {
                "name": "Dr. Sarah Johnson",
                "email": "sarah.johnson@lms.edu",
                "employee_id": "LEC001",
                "password": "lecturer123"
            },
            {
                "name": "Prof. Michael Chen",
                "email": "michael.chen@lms.edu", 
                "employee_id": "LEC002",
                "password": "lecturer123"
            },
            {
                "name": "Dr. Emily Rodriguez",
                "email": "emily.rodriguez@lms.edu",
                "employee_id": "LEC003", 
                "password": "lecturer123"
            }
        ]
        
        lecturer_objects = []
        for lec_data in lecturers:
            lecturer = User(
                name=lec_data["name"],
                email=lec_data["email"],
                password_hash=auth_manager.hash_password(lec_data["password"]),
                role=UserRole.LECTURER,
                employee_id=lec_data["employee_id"],
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(lecturer)
            lecturer_objects.append(lecturer)
        
        # Create Students
        students = [
            {
                "name": "Alice Smith",
                "email": "alice.smith@student.lms.edu",
                "student_id": "STU001",
                "password": "student123"
            },
            {
                "name": "Bob Wilson", 
                "email": "bob.wilson@student.lms.edu",
                "student_id": "STU002",
                "password": "student123"
            },
            {
                "name": "Carol Davis",
                "email": "carol.davis@student.lms.edu", 
                "student_id": "STU003",
                "password": "student123"
            }
        ]
        
        student_objects = []
        for std_data in students:
            student = User(
                name=std_data["name"],
                email=std_data["email"],
                password_hash=auth_manager.hash_password(std_data["password"]),
                role=UserRole.STUDENT,
                student_id=std_data["student_id"],
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(student)
            student_objects.append(student)
        
        # Commit users first to get IDs
        db.commit()
        print(f"✅ Created {len(lecturer_objects)} lecturers and {len(student_objects)} students")
        
        # ============================================================================
        # 2. CREATE DEPARTMENTS
        # ============================================================================
        print("🏢 Creating departments...")
        
        departments_data = [
            {
                "name": "Computer Science",
                "code": "CS",
                "description": "Department of Computer Science and Engineering",
                "head_lecturer": lecturer_objects[0]  # Dr. Sarah Johnson
            },
            {
                "name": "Mathematics", 
                "code": "MATH",
                "description": "Department of Mathematics and Statistics",
                "head_lecturer": lecturer_objects[1]  # Prof. Michael Chen
            },
            {
                "name": "Business Administration",
                "code": "BUS", 
                "description": "Department of Business and Management",
                "head_lecturer": lecturer_objects[2]  # Dr. Emily Rodriguez
            }
        ]
        
        department_objects = []
        for i, dept_data in enumerate(departments_data):
            department = Department(
                name=dept_data["name"],
                code=dept_data["code"],
                description=dept_data["description"],
                head_of_department_id=dept_data["head_lecturer"].id,
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(department)
            department_objects.append(department)
            
            # Assign lecturer to department
            dept_data["head_lecturer"].department_id = department.id
        
        db.commit()
        print(f"✅ Created {len(department_objects)} departments")
        
        # ============================================================================
        # 3. CREATE SEMESTERS
        # ============================================================================
        print("📅 Creating semesters...")
        
        current_year = datetime.now().year
        
        semesters_data = [
            {
                "name": f"Fall {current_year}",
                "type": SemesterType.FALL,
                "year": current_year,
                "is_current": True,
                "start_date": datetime(current_year, 9, 1),
                "end_date": datetime(current_year, 12, 15),
                "registration_start": datetime(current_year, 8, 1),
                "registration_end": datetime(current_year, 9, 15)
            },
            {
                "name": f"Spring {current_year + 1}",
                "type": SemesterType.SPRING,
                "year": current_year + 1,
                "is_current": False,
                "start_date": datetime(current_year + 1, 1, 15),
                "end_date": datetime(current_year + 1, 5, 15),
                "registration_start": datetime(current_year, 11, 1),
                "registration_end": datetime(current_year + 1, 1, 30)
            }
        ]
        
        semester_objects = []
        for sem_data in semesters_data:
            semester = Semester(
                name=sem_data["name"],
                semester_type=sem_data["type"],
                year=sem_data["year"],
                start_date=sem_data["start_date"],
                end_date=sem_data["end_date"],
                registration_start=sem_data["registration_start"],
                registration_end=sem_data["registration_end"],
                is_current=sem_data["is_current"],
                is_active=True
            )
            db.add(semester)
            semester_objects.append(semester)
        
        db.commit()
        print(f"✅ Created {len(semester_objects)} semesters")
        
        # ============================================================================
        # 4. CREATE PROGRAMS
        # ============================================================================
        print("🎓 Creating programs...")
        
        programs_data = [
            {
                "name": "Bachelor of Science in Computer Science",
                "code": "BSCS",
                "description": "Comprehensive undergraduate program in computer science",
                "type": ProgramType.BACHELOR,
                "department": department_objects[0],  # CS Department
                "duration_years": 4,
                "total_credits": 120
            },
            {
                "name": "Master of Science in Computer Science", 
                "code": "MSCS",
                "description": "Advanced graduate program in computer science",
                "type": ProgramType.MASTER,
                "department": department_objects[0],  # CS Department
                "duration_years": 2,
                "total_credits": 36
            },
            {
                "name": "Bachelor of Science in Mathematics",
                "code": "BSMATH",
                "description": "Comprehensive undergraduate program in mathematics",
                "type": ProgramType.BACHELOR,
                "department": department_objects[1],  # Math Department
                "duration_years": 4,
                "total_credits": 120
            },
            {
                "name": "Master of Business Administration",
                "code": "MBA",
                "description": "Professional graduate program in business administration",
                "type": ProgramType.MASTER,
                "department": department_objects[2],  # Business Department
                "duration_years": 2,
                "total_credits": 48
            }
        ]
        
        program_objects = []
        for prog_data in programs_data:
            program = Program(
                name=prog_data["name"],
                code=prog_data["code"],
                description=prog_data["description"],
                program_type=prog_data["type"],
                department_id=prog_data["department"].id,
                duration_years=prog_data["duration_years"],
                total_credits=prog_data["total_credits"],
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(program)
            program_objects.append(program)
        
        db.commit()
        print(f"✅ Created {len(program_objects)} programs")
        
        # ============================================================================
        # 5. CREATE COURSES
        # ============================================================================
        print("📚 Creating courses...")
        
        courses_data = [
            {
                "name": "Introduction to Computer Science",
                "code": "CS101",
                "description": "Fundamental concepts of computer science and programming",
                "credits": 3,
                "department": department_objects[0],  # CS Department
                "lecturer": lecturer_objects[0],  # Dr. Sarah Johnson
                "semester": semester_objects[0],  # Fall current year
                "max_capacity": 30
            },
            {
                "name": "Data Structures and Algorithms",
                "code": "CS201",
                "description": "Advanced data structures and algorithm analysis",
                "credits": 4,
                "department": department_objects[0],  # CS Department
                "lecturer": lecturer_objects[0],  # Dr. Sarah Johnson
                "semester": semester_objects[0],  # Fall current year
                "max_capacity": 25
            },
            {
                "name": "Calculus I",
                "code": "MATH101",
                "description": "Introduction to differential calculus",
                "credits": 4,
                "department": department_objects[1],  # Math Department
                "lecturer": lecturer_objects[1],  # Prof. Michael Chen
                "semester": semester_objects[0],  # Fall current year
                "max_capacity": 35
            },
            {
                "name": "Business Management",
                "code": "BUS101",
                "description": "Principles of business management and leadership",
                "credits": 3,
                "department": department_objects[2],  # Business Department
                "lecturer": lecturer_objects[2],  # Dr. Emily Rodriguez
                "semester": semester_objects[0],  # Fall current year
                "max_capacity": 40
            }
        ]
        
        course_objects = []
        for course_data in courses_data:
            course = Course(
                name=course_data["name"],
                code=course_data["code"],
                description=course_data["description"],
                credits=course_data["credits"],
                department_id=course_data["department"].id,
                lecturer_id=course_data["lecturer"].id,
                semester_id=course_data["semester"].id,
                max_capacity=course_data["max_capacity"],
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(course)
            course_objects.append(course)
        
        db.commit()
        print(f"✅ Created {len(course_objects)} courses")
        
        # ============================================================================
        # 6. CREATE ENROLLMENTS
        # ============================================================================
        print("📝 Creating enrollments...")
        
        # Enroll students in courses
        enrollments_data = [
            # Alice Smith enrollments
            {
                "student": student_objects[0],  # Alice Smith
                "course": course_objects[0],  # CS101
                "program": program_objects[0],  # BSCS
                "status": EnrollmentStatus.ENROLLED
            },
            {
                "student": student_objects[0],  # Alice Smith
                "course": course_objects[2],  # MATH101
                "program": program_objects[0],  # BSCS
                "status": EnrollmentStatus.ENROLLED
            },
            # Bob Wilson enrollments
            {
                "student": student_objects[1],  # Bob Wilson
                "course": course_objects[0],  # CS101
                "program": program_objects[0],  # BSCS
                "status": EnrollmentStatus.ENROLLED
            },
            {
                "student": student_objects[1],  # Bob Wilson
                "course": course_objects[1],  # CS201
                "program": program_objects[0],  # BSCS
                "status": EnrollmentStatus.ENROLLED
            },
            # Carol Davis enrollments
            {
                "student": student_objects[2],  # Carol Davis
                "course": course_objects[3],  # BUS101
                "program": program_objects[3],  # MBA
                "status": EnrollmentStatus.ENROLLED
            },
            {
                "student": student_objects[2],  # Carol Davis
                "course": course_objects[2],  # MATH101
                "program": program_objects[3],  # MBA
                "status": EnrollmentStatus.ENROLLED
            }
        ]
        
        enrollment_objects = []
        for enroll_data in enrollments_data:
            enrollment = Enrollment(
                student_id=enroll_data["student"].id,
                course_id=enroll_data["course"].id,
                program_id=enroll_data["program"].id,
                status=enroll_data["status"],
                enrollment_date=datetime.now(timezone.utc),
                is_active=True
            )
            db.add(enrollment)
            enrollment_objects.append(enrollment)
        
        db.commit()
        print(f"✅ Created {len(enrollment_objects)} enrollments")
        
        print("🎉 Fresh seed data created successfully!")
        print("\n📊 Summary:")
        print(f"  👤 Users: 1 Admin + {len(lecturer_objects)} Lecturers + {len(student_objects)} Students")
        print(f"  🏢 Departments: {len(department_objects)}")
        print(f"  📅 Semesters: {len(semester_objects)}")
        print(f"  🎓 Programs: {len(program_objects)}")
        print(f"  📚 Courses: {len(course_objects)}")
        print(f"  📝 Enrollments: {len(enrollment_objects)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating seed data: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = create_fresh_seed_data()
    if success:
        print("\n✅ Database seeding completed successfully!")
    else:
        print("\n❌ Database seeding failed!")
