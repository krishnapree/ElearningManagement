"""
Authentication Router (Demo Mode)
Returns mock user info for demo purposes only.
"""

from fastapi import APIRouter, Query

router = APIRouter(tags=["Authentication"])

MOCK_USERS = {
    "admin": {
        "id": 1,
        "name": "Demo Admin",
        "email": "admin@demo.com",
        "role": "admin",
        "created_at": "2024-01-01T00:00:00Z"
    },
    "lecturer": {
        "id": 2,
        "name": "Demo Lecturer",
        "email": "lecturer@demo.com",
        "role": "lecturer",
        "created_at": "2024-01-01T00:00:00Z"
    },
    "student": {
        "id": 3,
        "name": "Demo Student",
        "email": "student@demo.com",
        "role": "student",
        "created_at": "2024-01-01T00:00:00Z"
    }
}

@router.get("/user")
async def get_user(role: str = Query("admin", enum=["admin", "lecturer", "student"])):
    return MOCK_USERS.get(role, MOCK_USERS["admin"]) 