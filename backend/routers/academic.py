"""
Academic Router
Handles departments, programs, courses, semesters, and enrollments
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["Academic Management"])

# --- COMPREHENSIVE MOCK DATA ---
MOCK_DEPARTMENTS = [
    {
        "id": 1,
        "name": "Computer Science",
        "code": "CS",
        "description": "Department of Computer Science and Information Technology",
        "head_name": "Dr. Sarah Johnson",
        "total_programs": 3,
        "total_courses": 15,
        "total_students": 450,
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 2,
        "name": "Mathematics",
        "code": "MATH",
        "description": "Department of Mathematics and Statistics",
        "head_name": "Prof. Michael Chen",
        "total_programs": 2,
        "total_courses": 12,
        "total_students": 320,
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 3,
        "name": "Physics",
        "code": "PHYS",
        "description": "Department of Physics and Applied Sciences",
        "head_name": "Dr. Lisa Anderson",
        "total_programs": 2,
        "total_courses": 10,
        "total_students": 280,
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 4,
        "name": "Chemistry",
        "code": "CHEM",
        "description": "Department of Chemistry and Biochemistry",
        "head_name": "Dr. James Wilson",
        "total_programs": 2,
        "total_courses": 8,
        "total_students": 200,
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 5,
        "name": "Biology",
        "code": "BIO",
        "description": "Department of Biology and Life Sciences",
        "head_name": "Dr. Emily Davis",
        "total_programs": 2,
        "total_courses": 9,
        "total_students": 350,
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 6,
        "name": "Engineering",
        "code": "ENG",
        "description": "Department of Engineering and Technology",
        "head_name": "Prof. Robert Brown",
        "total_programs": 4,
        "total_courses": 18,
        "total_students": 520,
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z"
    }
]

MOCK_PROGRAMS = [
    {
        "id": 1,
        "name": "Bachelor of Science in Computer Science",
        "code": "BSC-CS",
        "description": "Comprehensive computer science program covering algorithms, software engineering, and AI",
        "program_type": "Bachelor",
        "duration_years": 4,
        "total_credits": 120,
        "department_id": 1,
        "department_name": "Computer Science",
        "total_courses": 15,
        "enrolled_students": 180,
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 2,
        "name": "Bachelor of Science in Mathematics",
        "code": "BSC-MATH",
        "description": "Advanced mathematics program with focus on pure and applied mathematics",
        "program_type": "Bachelor",
        "duration_years": 4,
        "total_credits": 120,
        "department_id": 2,
        "department_name": "Mathematics",
        "total_courses": 12,
        "enrolled_students": 120,
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z"
    },
    {
        "id": 3,
        "name": "Master of Science in Data Science",
        "code": "MSC-DS",
        "description": "Advanced data science program combining statistics, machine learning, and big data",
        "program_type": "Master",
        "duration_years": 2,
        "total_credits": 60,
        "department_id": 1,
        "department_name": "Computer Science",
        "total_courses": 8,
        "enrolled_students": 45,
        "is_active": True,
        "created_at": "2024-01-01T00:00:00Z"
    }
]

MOCK_COURSES = [
    {
        "id": 1,
        "name": "Introduction to Programming",
        "code": "CS101",
        "description": "Learn fundamental programming concepts using Python. Covers variables, control structures, functions, and basic data structures.",
        "program_id": 1,
        "semester_id": 1,
        "lecturer_id": 1,
        "credits": 3,
        "department_name": "Computer Science",
        "lecturer_name": "Dr. Sarah Johnson",
        "semester_name": "Fall 2024",
        "max_capacity": 30,
        "enrolled_count": 28,
        "available_spots": 2,
        "is_active": True
    },
    {
        "id": 2,
        "name": "Data Structures and Algorithms",
        "code": "CS201",
        "description": "Advanced study of data structures and algorithms. Covers arrays, linked lists, trees, graphs, and algorithm analysis.",
        "program_id": 1,
        "semester_id": 2,
        "lecturer_id": 1,
        "credits": 4,
        "department_name": "Computer Science",
        "lecturer_name": "Dr. Sarah Johnson",
        "semester_name": "Fall 2024",
        "max_capacity": 25,
        "enrolled_count": 23,
        "available_spots": 2,
        "is_active": True
    },
    {
        "id": 3,
        "name": "Database Systems",
        "code": "CS301",
        "description": "Comprehensive study of database design, SQL, and database management systems. Includes hands-on projects.",
        "program_id": 1,
        "semester_id": 3,
        "lecturer_id": 2,
        "credits": 3,
        "department_name": "Computer Science",
        "lecturer_name": "Prof. Michael Chen",
        "semester_name": "Fall 2024",
        "max_capacity": 20,
        "enrolled_count": 18,
        "available_spots": 2,
        "is_active": True
    },
    {
        "id": 4,
        "name": "Software Engineering",
        "code": "CS350",
        "description": "Software development lifecycle, project management, testing, and team collaboration in large-scale projects.",
        "program_id": 1,
        "semester_id": 4,
        "lecturer_id": 3,
        "credits": 4,
        "department_name": "Computer Science",
        "lecturer_name": "Dr. Emily Rodriguez",
        "semester_name": "Fall 2024",
        "max_capacity": 22,
        "enrolled_count": 20,
        "available_spots": 2,
        "is_active": True
    },
    {
        "id": 5,
        "name": "Calculus I",
        "code": "MATH101",
        "description": "Differential and integral calculus with applications. Foundation course for engineering and science majors.",
        "program_id": 2,
        "semester_id": 1,
        "lecturer_id": 4,
        "credits": 4,
        "department_name": "Mathematics",
        "lecturer_name": "Dr. James Wilson",
        "semester_name": "Fall 2024",
        "max_capacity": 35,
        "enrolled_count": 32,
        "available_spots": 3,
        "is_active": True
    },
    {
        "id": 6,
        "name": "Linear Algebra",
        "code": "MATH201",
        "description": "Vector spaces, matrices, eigenvalues, and linear transformations with computational applications.",
        "program_id": 2,
        "semester_id": 2,
        "lecturer_id": 4,
        "credits": 3,
        "department_name": "Mathematics",
        "lecturer_name": "Dr. James Wilson",
        "semester_name": "Fall 2024",
        "max_capacity": 28,
        "enrolled_count": 25,
        "available_spots": 3,
        "is_active": True
    },
    {
        "id": 7,
        "name": "Machine Learning",
        "code": "DS501",
        "description": "Introduction to machine learning algorithms, supervised and unsupervised learning, and practical applications.",
        "program_id": 3,
        "semester_id": 1,
        "lecturer_id": 5,
        "credits": 4,
        "department_name": "Data Science",
        "lecturer_name": "Dr. Lisa Chang",
        "semester_name": "Fall 2024",
        "max_capacity": 24,
        "enrolled_count": 22,
        "available_spots": 2,
        "is_active": True
    },
    {
        "id": 8,
        "name": "Big Data Analytics",
        "code": "DS502",
        "description": "Processing and analyzing large datasets using modern tools and techniques. Covers Hadoop, Spark, and cloud platforms.",
        "program_id": 3,
        "semester_id": 2,
        "lecturer_id": 5,
        "credits": 3,
        "department_name": "Data Science",
        "lecturer_name": "Dr. Lisa Chang",
        "semester_name": "Fall 2024",
        "max_capacity": 20,
        "enrolled_count": 18,
        "available_spots": 2,
        "is_active": True
    },
    {
        "id": 9,
        "name": "Web Development",
        "code": "CS250",
        "description": "Modern web development with HTML, CSS, JavaScript, and popular frameworks. Build responsive web applications.",
        "program_id": 1,
        "semester_id": 1,
        "lecturer_id": 1,
        "credits": 3,
        "department_name": "Computer Science",
        "lecturer_name": "Dr. Sarah Johnson",
        "semester_name": "Fall 2024",
        "max_capacity": 25,
        "enrolled_count": 24,
        "available_spots": 1,
        "is_active": True
    },
    {
        "id": 10,
        "name": "Mobile App Development",
        "code": "CS380",
        "description": "iOS and Android app development using modern frameworks. Learn to build cross-platform mobile applications.",
        "program_id": 1,
        "semester_id": 2,
        "lecturer_id": 3,
        "credits": 4,
        "department_name": "Computer Science",
        "lecturer_name": "Dr. Emily Rodriguez",
        "semester_name": "Fall 2024",
        "max_capacity": 18,
        "enrolled_count": 16,
        "available_spots": 2,
        "is_active": True
    }
]

MOCK_SEMESTERS = [
    {"id": 1, "name": "Fall 2024", "year": 2024, "start_date": "2024-09-01", "end_date": "2024-12-15", "is_active": True},
    {"id": 2, "name": "Spring 2024", "year": 2024, "start_date": "2024-01-15", "end_date": "2024-05-15", "is_active": False},
    {"id": 3, "name": "Summer 2024", "year": 2024, "start_date": "2024-06-01", "end_date": "2024-08-15", "is_active": False},
    {"id": 4, "name": "Spring 2025", "year": 2025, "start_date": "2025-01-15", "end_date": "2025-05-15", "is_active": False}
]

MOCK_OVERVIEW = {
    "total_departments": 6,
    "total_programs": 3,
    "total_courses": 8,
    "total_semesters": 4,
    "active_semester": "Fall 2024",
    "total_students": 2120,
    "total_lecturers": 25
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