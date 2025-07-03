"""
Unit tests for authentication functionality
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import get_db
from models import Base, User, UserRole
from auth import AuthManager

# Create in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

def override_get_db():
    """Override database dependency for testing"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Override database dependency
app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

class TestAuth:
    """Test authentication endpoints"""
    
    def setup_method(self):
        """Setup test data"""
        self.db = TestingSessionLocal()
        self.auth_manager = AuthManager()
        
        # Create test user
        self.test_user = User(
            name="Test User",
            email="test@example.com",
            password_hash=self.auth_manager.hash_password("testpass123"),
            role=UserRole.STUDENT
        )
        self.db.add(self.test_user)
        self.db.commit()
    
    def teardown_method(self):
        """Cleanup test data"""
        self.db.close()
    
    def test_register_success(self):
        """Test successful user registration"""
        response = client.post("/api/register", json={
            "name": "New User",
            "email": "newuser@example.com",
            "password": "newpass123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "newuser@example.com"
        assert data["user"]["name"] == "New User"
    
    def test_register_duplicate_email(self):
        """Test registration with duplicate email"""
        response = client.post("/api/register", json={
            "name": "Another User",
            "email": "test@example.com",  # Already exists
            "password": "pass123"
        })
        
        assert response.status_code == 400
    
    def test_login_success(self):
        """Test successful login"""
        response = client.post("/api/login", json={
            "email": "test@example.com",
            "password": "testpass123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == "test@example.com"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = client.post("/api/login", json={
            "email": "test@example.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
    
    def test_logout(self):
        """Test logout functionality"""
        response = client.post("/api/logout")
        
        assert response.status_code == 200
        assert response.json()["message"] == "Successfully logged out" 