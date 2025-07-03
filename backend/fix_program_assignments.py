#!/usr/bin/env python3
"""
Fix Program Assignments and Course Allocations
This script assigns lecturers to programs and allocates courses to programs
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from models import (
    User, UserRole, Department, Program, Course, Semester, 
    ProgramLecturer, ProgramCourse
)
from datetime import datetime, timezone

def fix_program_assignments():
    """Fix program assignments and course allocations"""
    
    print("🔧 Fixing program assignments and course allocations...")
    
    db = next(get_db())
    
    try:
        # 1. Get the Computer Science department and program
        cs_department = db.query(Department).filter(
            Department.code == "CS"
        ).first()
        
        if not cs_department:
            print("❌ Computer Science department not found")
            return False
            
        cs_program = db.query(Program).filter(
            Program.department_id == cs_department.id,
            Program.code == "BSCS"
        ).first()
        
        if not cs_program:
            print("❌ Computer Science program not found")
            return False
            
        print(f"✅ Found CS Program: {cs_program.name} (ID: {cs_program.id})")
        
        # 2. Get Dr. Sarah Johnson (head of CS department)
        sarah_johnson = db.query(User).filter(
            User.email == "sarah.johnson@lms.edu",
            User.role == UserRole.LECTURER
        ).first()
        
        if not sarah_johnson:
            print("❌ Dr. Sarah Johnson not found")
            return False
            
        print(f"✅ Found Lecturer: {sarah_johnson.name} (ID: {sarah_johnson.id})")
        
        # 3. Check if lecturer is already assigned to program
        existing_assignment = db.query(ProgramLecturer).filter(
            ProgramLecturer.program_id == cs_program.id,
            ProgramLecturer.lecturer_id == sarah_johnson.id
        ).first()
        
        if existing_assignment:
            if existing_assignment.is_active:
                print("✅ Lecturer already assigned to program")
            else:
                existing_assignment.is_active = True
                db.commit()
                print("✅ Reactivated lecturer assignment")
        else:
            # Create new assignment
            assignment = ProgramLecturer(
                program_id=cs_program.id,
                lecturer_id=sarah_johnson.id,
                assigned_by_id=1,  # Admin
                role="lecturer",
                is_active=True
            )
            db.add(assignment)
            db.commit()
            print("✅ Created new lecturer assignment")
        
        # 4. Get courses in CS department
        cs_courses = db.query(Course).filter(
            Course.department_id == cs_department.id,
            Course.is_active == True
        ).all()
        
        print(f"📚 Found {len(cs_courses)} courses in CS department")
        
        # 5. Allocate courses to the program
        allocated_count = 0
        for i, course in enumerate(cs_courses):
            # Check if course is already allocated
            existing_allocation = db.query(ProgramCourse).filter(
                ProgramCourse.program_id == cs_program.id,
                ProgramCourse.course_id == course.id
            ).first()
            
            if existing_allocation:
                if existing_allocation.is_active:
                    print(f"   ✅ {course.code} already allocated")
                else:
                    existing_allocation.is_active = True
                    allocated_count += 1
                    print(f"   ✅ Reactivated {course.code}")
            else:
                # Create new allocation
                allocation = ProgramCourse(
                    program_id=cs_program.id,
                    course_id=course.id,
                    is_required=True,
                    semester_order=i + 1,  # Sequential semester order
                    allocated_by_id=1,  # Admin
                    is_active=True
                )
                db.add(allocation)
                allocated_count += 1
                print(f"   ✅ Allocated {course.code} to program")
        
        db.commit()
        
        print(f"\n🎉 Successfully allocated {allocated_count} courses to CS program")
        
        # 6. Verify the assignments
        print("\n📋 Verification:")
        
        # Check lecturer assignments
        lecturer_assignments = db.query(ProgramLecturer).filter(
            ProgramLecturer.program_id == cs_program.id,
            ProgramLecturer.is_active == True
        ).all()
        
        print(f"   👨‍🏫 Lecturers assigned: {len(lecturer_assignments)}")
        for assignment in lecturer_assignments:
            lecturer = assignment.lecturer
            print(f"      - {lecturer.name} ({assignment.role})")
        
        # Check course allocations
        course_allocations = db.query(ProgramCourse).filter(
            ProgramCourse.program_id == cs_program.id,
            ProgramCourse.is_active == True
        ).all()
        
        print(f"   📚 Courses allocated: {len(course_allocations)}")
        for allocation in course_allocations:
            course = allocation.course
            print(f"      - {course.code}: {course.name} (Semester {allocation.semester_order})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fixing program assignments: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def create_sample_courses():
    """Create sample courses if none exist"""
    
    print("\n📚 Creating sample courses...")
    
    db = next(get_db())
    
    try:
        # Get CS department
        cs_department = db.query(Department).filter(Department.code == "CS").first()
        if not cs_department:
            print("❌ CS department not found")
            return False
        
        # Get current semester
        current_semester = db.query(Semester).filter(Semester.is_current == True).first()
        if not current_semester:
            print("❌ Current semester not found")
            return False
        
        # Get Dr. Sarah Johnson
        sarah_johnson = db.query(User).filter(
            User.email == "sarah.johnson@lms.edu"
        ).first()
        
        # Sample CS courses
        sample_courses = [
            {
                "name": "Introduction to Programming",
                "code": "CS101",
                "description": "Fundamentals of programming and problem solving",
                "credits": 3,
                "lecturer_id": sarah_johnson.id if sarah_johnson else None
            },
            {
                "name": "Data Structures and Algorithms",
                "code": "CS201",
                "description": "Advanced programming concepts and algorithm design",
                "credits": 4,
                "lecturer_id": sarah_johnson.id if sarah_johnson else None
            },
            {
                "name": "Database Systems",
                "code": "CS301",
                "description": "Database design, implementation, and management",
                "credits": 3,
                "lecturer_id": sarah_johnson.id if sarah_johnson else None
            },
            {
                "name": "Software Engineering",
                "code": "CS401",
                "description": "Software development methodologies and practices",
                "credits": 4,
                "lecturer_id": sarah_johnson.id if sarah_johnson else None
            }
        ]
        
        created_count = 0
        for course_data in sample_courses:
            # Check if course already exists
            existing_course = db.query(Course).filter(
                Course.code == course_data["code"],
                Course.department_id == cs_department.id
            ).first()
            
            if existing_course:
                print(f"   ✅ {course_data['code']} already exists")
                continue
            
            # Create new course
            course = Course(
                name=course_data["name"],
                code=course_data["code"],
                description=course_data["description"],
                credits=course_data["credits"],
                department_id=cs_department.id,
                semester_id=current_semester.id,
                lecturer_id=course_data["lecturer_id"],
                max_capacity=30,
                is_active=True
            )
            
            db.add(course)
            created_count += 1
            print(f"   ✅ Created {course_data['code']}: {course_data['name']}")
        
        db.commit()
        print(f"\n🎉 Created {created_count} new courses")
        return True
        
    except Exception as e:
        print(f"❌ Error creating courses: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    print("🔧 Program Assignment and Course Allocation Fix")
    print("=" * 50)
    
    # First, create sample courses if needed
    create_sample_courses()
    
    # Then fix program assignments
    if fix_program_assignments():
        print("\n✅ All fixes applied successfully!")
        print("\n📋 Summary:")
        print("   - Lecturer assigned to CS program")
        print("   - Courses allocated to CS program")
        print("   - Ready for lecturer to view their programs")
    else:
        print("\n❌ Failed to apply fixes")

if __name__ == "__main__":
    main() 