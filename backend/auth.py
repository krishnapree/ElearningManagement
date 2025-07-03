import os
import jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional, Tuple

from database import get_db
from models import User, UserRole

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "development_secret_key")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30  # 30 days

# Security scheme for token extraction
security = HTTPBearer()

class AuthManager:
    def create_user(self, db: Session, name: str, email: str, password: str, role: Optional[UserRole] = None) -> User:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise ValueError("Email already registered")

        # Hash password
        hashed_password = pwd_context.hash(password)

        # Create new user
        user = User(
            name=name,
            email=email,
            password_hash=hashed_password,
            role=role or UserRole.STUDENT  # Default to student if no role specified
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    def authenticate_user(self, db: Session, email: str, password: str) -> User:
        user = db.query(User).filter(User.email == email).first()

        if not user or not pwd_context.verify(password, user.password_hash):
            raise ValueError("Invalid email or password")

        return user

    def create_access_token(self, user_id: int) -> str:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        expire = datetime.now(timezone.utc) + expires_delta

        payload = {
            "sub": str(user_id),
            "exp": expire,
            "type": "access"
        }

        return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    def create_refresh_token(self, user_id: int) -> str:
        expires_delta = timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES)
        expire = datetime.now(timezone.utc) + expires_delta

        payload = {
            "sub": str(user_id),
            "exp": expire,
            "type": "refresh"
        }

        return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    def validate_token(self, token: str, token_type: str = "access") -> int:
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

            # Check token type
            if payload.get("type") != token_type:
                raise jwt.InvalidTokenError(f"Invalid token type: {payload.get('type')}")

            # Extract user ID
            user_id = int(payload.get("sub"))

            return user_id
        except (jwt.InvalidTokenError, jwt.ExpiredSignatureError, ValueError):
            raise ValueError("Invalid or expired token")

    def validate_refresh_token(self, token: str) -> int:
        return self.validate_token(token, "refresh")

    def verify_token(self, token: str) -> Tuple[Optional[int], Optional[str]]:
        """Verify token and return user_id and token_type."""
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            user_id = int(payload.get("sub"))
            token_type = payload.get("type")
            return user_id, token_type
        except (jwt.InvalidTokenError, jwt.ExpiredSignatureError, ValueError):
            return None, None

    def get_user_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return db.query(User).filter(User.id == user_id).first()

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against a hashed password."""
        return pwd_context.verify(plain_password, hashed_password)

    def hash_password(self, password: str) -> str:
        """Hash a plain password."""
        return pwd_context.hash(password)

# Create global auth manager instance
auth_manager = AuthManager()

# Dependency to get current user from token
async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    # Try to get token from cookie first
    token = request.cookies.get("access_token")

    # If not in cookie, try Authorization header
    if not token:
        authorization = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization[7:]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id, token_type = auth_manager.verify_token(token)
    if user_id is None or token_type != "access":
        raise HTTPException(status_code=401, detail="Invalid token")

    user = auth_manager.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")

    return user

# Optional dependency for routes that can work with or without authentication
async def get_current_user_optional(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    """Get current user if authenticated, otherwise return None."""
    try:
        return await get_current_user(request, db)
    except HTTPException:
        return None


