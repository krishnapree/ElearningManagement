import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Database configuration
database_url = os.getenv("DATABASE_URL")

if not database_url:
    # Fallback to SQLite for development - NEW FRESH DATABASE
    database_url = "sqlite:///./lms.db"

# Export for use in other modules
DATABASE_URL = database_url

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False,  # Set to True for SQL debugging
    connect_args={"check_same_thread": False} if database_url.startswith("sqlite") else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Import Base from models to avoid circular imports
def get_base():
    """Get the Base class from models"""
    from models import Base
    return Base

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to test database connection
def test_connection():
    """Test database connection."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False

# Function to create all tables
def create_tables():
    """Create all database tables."""
    Base = get_base()
    Base.metadata.create_all(bind=engine)

