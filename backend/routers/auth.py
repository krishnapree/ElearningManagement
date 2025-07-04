"""
Authentication Router
Handles login, logout, registration, and token management
"""

from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any
import os

from database import get_db
from models import User
from auth import AuthManager, get_current_user

router = APIRouter(tags=["Authentication"])

# Pydantic models
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

# Initialize auth manager
auth_manager = AuthManager()

# Determine if running in production for secure cookies
IS_PRODUCTION = os.getenv("ENV", "development").lower() == "production"
COOKIE_SECURE = IS_PRODUCTION

@router.post("/register")
async def register(request: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        from utils.validation import InputValidator
        
        # Validate input data
        validated_data = {
            'name': InputValidator.validate_required_string(request.name, 'Name', 'name'),
            'email': InputValidator.validate_email(request.email),
            'password': InputValidator.validate_required_string(request.password, 'Password', 'medium_text')
        }

        user = auth_manager.create_user(db, validated_data['name'], validated_data['email'], validated_data['password'])
        token = auth_manager.create_access_token(user.id)

        # Set HTTP-only cookie
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=COOKIE_SECURE,  # Dynamic based on environment
            samesite="lax",
            max_age=86400 * 7  # 7 days
        )

        return {
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role.value,
                "created_at": user.created_at.isoformat()
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to register user: {str(e)}")

@router.post("/login")
async def login(request: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Login user"""
    try:
        user = auth_manager.authenticate_user(db, request.email, request.password)
        token = auth_manager.create_access_token(user.id)

        # Set HTTP-only cookie
        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=COOKIE_SECURE,  # Dynamic based on environment
            samesite="lax",
            max_age=86400 * 7  # 7 days
        )

        return {
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role.value,
                "created_at": user.created_at.isoformat()
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to login: {str(e)}")

@router.post("/logout")
async def logout(response: Response):
    """Logout user"""
    response.delete_cookie(key="access_token")
    return {"message": "Successfully logged out"}

@router.get("/user")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.value,
        "created_at": current_user.created_at.isoformat()
    }

@router.post("/refresh-token")
async def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    """Refresh access token"""
    try:
        # Get token from cookie
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="No access token found")

        # Verify and decode token
        payload = auth_manager.decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        # Create new token
        new_token = auth_manager.create_access_token(user.id)

        # Set new cookie
        response.set_cookie(
            key="access_token",
            value=new_token,
            httponly=True,
            secure=COOKIE_SECURE,  # Dynamic based on environment
            samesite="lax",
            max_age=86400 * 7
        )

        return {"message": "Token refreshed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh token: {str(e)}") 