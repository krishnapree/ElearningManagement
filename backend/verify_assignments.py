#!/usr/bin/env python3
"""
Verify current lecturer assignments and course allocations
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from models import User, ProgramLecturer, ProgramCourse, Program, Course, Department

def verify_assignments():
    """Verify current assignments and allocations"""
    
    print("🔍 Verifying Current Assignments and Allocations")
    print("=" * 50)
    
    db = next(get_db())
    
    try:
        # 1. Check all lecturer assignments
        print("\n📋 LECTURER ASSIGNMENTS:")
        assignments = db.query(ProgramLecturer).filter(ProgramLecturer.is_active == True).all()
        
        if not assignments:
            print("   ❌ No lecturer assignments found!")
        else:
            for assignment in assignments:
                lecturer = assignment.lecturer
                program = assignment.program
                print(f"   ✅ {lecturer.name} -> {program.name} ({assignment.role})")
        
        # 2. Check all course allocations
        print("\n📚 COURSE ALLOCATIONS:")
        allocations = db.query(ProgramCourse).filter(ProgramCourse.is_active == True).all()
        
        if not allocations:
            print("   ❌ No course allocations found!")
        else:
            for allocation in allocations:
                course = allocation.course
                program = allocation.program
                print(f"   ✅ {course.code} -> {program.name} (Sem {allocation.semester_order})")
        
        # 3. Check specific lecturers
        print("\n👨‍🏫 LECTURER DETAILS:")
        lecturers = db.query(User).filter(User.role == "lecturer").all()
        
        for lecturer in lecturers:
            print(f"\n   👤 {lecturer.name} ({lecturer.email}):")
            
            # Check program assignments
            lecturer_assignments = db.query(ProgramLecturer).filter(
                ProgramLecturer.lecturer_id == lecturer.id,
                ProgramLecturer.is_active == True
            ).all()
            
            if lecturer_assignments:
                for assignment in lecturer_assignments:
                    program = assignment.program
                    print(f"      📋 Assigned to: {program.name} ({assignment.role})")
                    
                    # Check courses in this program
                    program_courses = db.query(ProgramCourse).filter(
                        ProgramCourse.program_id == program.id,
                        ProgramCourse.is_active == True
                    ).all()
                    
                    print(f"      📚 Courses in program: {len(program_courses)}")
                    for pc in program_courses:
                        course = pc.course
                        print(f"         - {course.code}: {course.name}")
            else:
                print(f"      ❌ No program assignments")
        
        # 4. Check CS program specifically
        print("\n🏢 COMPUTER SCIENCE PROGRAM:")
        cs_program = db.query(Program).filter(Program.code == "BSCS").first()
        
        if cs_program:
            print(f"   📋 Program: {cs_program.name}")
            
            # Check lecturers assigned to CS program
            cs_lecturers = db.query(ProgramLecturer).filter(
                ProgramLecturer.program_id == cs_program.id,
                ProgramLecturer.is_active == True
            ).all()
            
            print(f"   👨‍🏫 Assigned Lecturers: {len(cs_lecturers)}")
            for assignment in cs_lecturers:
                lecturer = assignment.lecturer
                print(f"      - {lecturer.name} ({assignment.role})")
            
            # Check courses allocated to CS program
            cs_courses = db.query(ProgramCourse).filter(
                ProgramCourse.program_id == cs_program.id,
                ProgramCourse.is_active == True
            ).all()
            
            print(f"   📚 Allocated Courses: {len(cs_courses)}")
            for allocation in cs_courses:
                course = allocation.course
                print(f"      - {course.code}: {course.name} (Sem {allocation.semester_order})")
        else:
            print("   ❌ CS program not found")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verifying assignments: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    verify_assignments() 