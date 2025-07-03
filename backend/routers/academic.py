"""
Academic Router
Handles departments, programs, courses, semesters, and enrollments
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import User
from auth import AuthManager, get_current_user
from services.academic_service import AcademicService

router = APIRouter(prefix="/api/academic", tags=["Academic Management"])

# Initialize services
auth_manager = AuthManager()
academic_service = AcademicService()

@router.get("/departments")
async def get_departments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all departments"""
    try:
        departments = academic_service.get_departments(db)
        return {"departments": departments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get departments: {str(e)}")

@router.post("/departments")
async def create_department(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new department"""
    try:
        if current_user.role.value != "admin":
            raise HTTPException(status_code=403, detail="Only admins can create departments")
        
        department = academic_service.create_department(db, request)
        return {"department": department, "message": "Department created successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create department: {str(e)}")

@router.put("/departments/{department_id}")
async def update_department(
    department_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a department"""
    try:
        if current_user.role.value != "admin":
            raise HTTPException(status_code=403, detail="Only admins can update departments")
        
        department = academic_service.update_department(db, department_id, request)
        return {"department": department, "message": "Department updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update department: {str(e)}")

@router.get("/departments/{department_id}/can-delete")
async def check_department_deletion(
    department_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if department can be deleted"""
    try:
        if current_user.role.value != "admin":
            raise HTTPException(status_code=403, detail="Only admins can check department deletion")
        
        result = academic_service.can_delete_department(db, department_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check department deletion: {str(e)}")

@router.delete("/departments/{department_id}")
async def delete_department(
    department_id: int,
    force: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a department"""
    try:
        if current_user.role.value != "admin":
            raise HTTPException(status_code=403, detail="Only admins can delete departments")
        
        academic_service.delete_department(db, department_id, force)
        return {"message": "Department deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete department: {str(e)}")

@router.get("/departments/{department_id}")
async def get_department_details(
    department_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get department details"""
    try:
        department = academic_service.get_department_details(db, department_id)
        return {"department": department}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get department details: {str(e)}")

@router.post("/departments/{department_id}/assign-lecturer")
async def assign_lecturer_to_department(
    department_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assign lecturer to department"""
    try:
        if current_user.role.value != "admin":
            raise HTTPException(status_code=403, detail="Only admins can assign lecturers")
        
        result = academic_service.assign_lecturer_to_department(db, request["lecturer_id"], department_id)
        return {"message": "Lecturer assigned successfully", "details": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to assign lecturer: {str(e)}")

@router.get("/programs")
async def get_programs(
    department_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all programs"""
    try:
        programs = academic_service.get_programs(db, department_id)
        return {"programs": programs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get programs: {str(e)}")

@router.post("/programs")
async def create_program(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new program"""
    try:
        if current_user.role.value != "admin":
            raise HTTPException(status_code=403, detail="Only admins can create programs")
        
        program = academic_service.create_program(db, request)
        return {"program": program, "message": "Program created successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create program: {str(e)}")

@router.put("/programs/{program_id}")
async def update_program(
    program_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a program"""
    try:
        if current_user.role.value != "admin":
            raise HTTPException(status_code=403, detail="Only admins can update programs")
        
        program = academic_service.update_program(db, program_id, request)
        return {"program": program, "message": "Program updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update program: {str(e)}")

@router.delete("/programs/{program_id}")
async def delete_program(
    program_id: int,
    force: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a program"""
    try:
        if current_user.role.value != "admin":
            raise HTTPException(status_code=403, detail="Only admins can delete programs")
        
        academic_service.delete_program(db, program_id, force)
        return {"message": "Program deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete program: {str(e)}")

@router.get("/courses")
async def get_courses(
    semester_id: Optional[int] = None,
    department_id: Optional[int] = None,
    lecturer_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all courses"""
    try:
        courses = academic_service.get_courses(db, semester_id, department_id, lecturer_id)
        return {"courses": courses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get courses: {str(e)}")

@router.get("/semesters")
async def get_semesters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all semesters"""
    try:
        semesters = academic_service.get_semesters(db)
        return {"semesters": semesters}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get semesters: {str(e)}")

@router.post("/semesters")
async def create_semester(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new semester"""
    try:
        if current_user.role.value != "admin":
            raise HTTPException(status_code=403, detail="Only admins can create semesters")
        
        # This would need to be implemented in academic_service
        raise HTTPException(status_code=501, detail="Create semester not implemented yet")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create semester: {str(e)}")

@router.get("/overview")
async def get_academic_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get academic overview"""
    try:
        overview = academic_service.get_academic_overview(db)
        return {"overview": overview}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get academic overview: {str(e)}") 