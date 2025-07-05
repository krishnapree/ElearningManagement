"""
Academic Router
Handles departments, programs, courses, semesters, and enrollments
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["Academic Management"])

# --- MOCK DATA ---
MOCK_DEPARTMENTS = [
    {"id": 1, "name": "Computer Science", "description": "CS Dept"},
    {"id": 2, "name": "Mathematics", "description": "Math Dept"},
]
MOCK_PROGRAMS = [
    {"id": 1, "name": "BSc Computer Science", "department_id": 1},
    {"id": 2, "name": "BSc Mathematics", "department_id": 2},
]
MOCK_COURSES = [
    {"id": 1, "name": "Algorithms", "program_id": 1, "semester_id": 1, "lecturer_id": 1},
    {"id": 2, "name": "Calculus", "program_id": 2, "semester_id": 1, "lecturer_id": 2},
]
MOCK_SEMESTERS = [
    {"id": 1, "name": "Semester 1", "year": 2024},
    {"id": 2, "name": "Semester 2", "year": 2024},
]
MOCK_OVERVIEW = {
    "total_departments": 2,
    "total_programs": 2,
    "total_courses": 2,
    "total_semesters": 2,
}

# --- ENDPOINTS ---
@router.get("/departments")
async def get_departments():
    return {"departments": MOCK_DEPARTMENTS}

@router.post("/departments")
async def create_department(request: dict):
    dept = {"id": len(MOCK_DEPARTMENTS)+1, **request}
    MOCK_DEPARTMENTS.append(dept)
    return {"department": dept, "message": "Department created successfully"}

@router.put("/departments/{department_id}")
async def update_department(department_id: int, request: dict):
    for dept in MOCK_DEPARTMENTS:
        if dept["id"] == department_id:
            dept.update(request)
            return {"department": dept, "message": "Department updated successfully"}
    raise HTTPException(status_code=404, detail="Department not found")

@router.get("/departments/{department_id}/can-delete")
async def check_department_deletion(department_id: int):
    return {"can_delete": True}

@router.delete("/departments/{department_id}")
async def delete_department(department_id: int, force: bool = False):
    for dept in MOCK_DEPARTMENTS:
        if dept["id"] == department_id:
            MOCK_DEPARTMENTS.remove(dept)
            return {"message": "Department deleted successfully"}
    raise HTTPException(status_code=404, detail="Department not found")

@router.get("/departments/{department_id}")
async def get_department_details(department_id: int):
    for dept in MOCK_DEPARTMENTS:
        if dept["id"] == department_id:
            return {"department": dept}
    raise HTTPException(status_code=404, detail="Department not found")

@router.post("/departments/{department_id}/assign-lecturer")
async def assign_lecturer_to_department(department_id: int, request: dict):
    return {"message": "Lecturer assigned successfully", "details": request}

@router.get("/programs")
async def get_programs(department_id: int = None):
    if department_id:
        return {"programs": [p for p in MOCK_PROGRAMS if p["department_id"] == department_id]}
    return {"programs": MOCK_PROGRAMS}

@router.post("/programs")
async def create_program(request: dict):
    prog = {"id": len(MOCK_PROGRAMS)+1, **request}
    MOCK_PROGRAMS.append(prog)
    return {"program": prog, "message": "Program created successfully"}

@router.put("/programs/{program_id}")
async def update_program(program_id: int, request: dict):
    for prog in MOCK_PROGRAMS:
        if prog["id"] == program_id:
            prog.update(request)
            return {"program": prog, "message": "Program updated successfully"}
    raise HTTPException(status_code=404, detail="Program not found")

@router.delete("/programs/{program_id}")
async def delete_program(program_id: int, force: bool = False):
    for prog in MOCK_PROGRAMS:
        if prog["id"] == program_id:
            MOCK_PROGRAMS.remove(prog)
            return {"message": "Program deleted successfully"}
    raise HTTPException(status_code=404, detail="Program not found")

@router.get("/courses")
async def get_courses(semester_id: int = None, department_id: int = None, lecturer_id: int = None):
    courses = MOCK_COURSES
    if semester_id:
        courses = [c for c in courses if c["semester_id"] == semester_id]
    if department_id:
        courses = [c for c in courses if any(p["id"] == c["program_id"] and p["department_id"] == department_id for p in MOCK_PROGRAMS)]
    if lecturer_id:
        courses = [c for c in courses if c["lecturer_id"] == lecturer_id]
    return {"courses": courses}

@router.get("/semesters")
async def get_semesters():
    return {"semesters": MOCK_SEMESTERS}

@router.post("/semesters")
async def create_semester(request: dict):
    sem = {"id": len(MOCK_SEMESTERS)+1, **request}
    MOCK_SEMESTERS.append(sem)
    return {"semester": sem, "message": "Semester created successfully"}

@router.get("/overview")
async def get_academic_overview():
    return {"overview": MOCK_OVERVIEW} 