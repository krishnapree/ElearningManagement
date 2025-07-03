"""
Error Handling Utilities
Provides structured error handling and logging
"""

import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from pydantic import ValidationError

logger = logging.getLogger(__name__)

class ErrorHandler:
    """Centralized error handling for the application"""
    
    @staticmethod
    def handle_database_error(error: SQLAlchemyError, operation: str) -> HTTPException:
        """Handle database-related errors"""
        logger.error(f"Database error during {operation}: {str(error)}")
        
        if isinstance(error, IntegrityError):
            if "UNIQUE constraint failed" in str(error):
                return HTTPException(
                    status_code=409,
                    detail="Resource already exists with the same unique identifier"
                )
            elif "FOREIGN KEY constraint failed" in str(error):
                return HTTPException(
                    status_code=400,
                    detail="Referenced resource does not exist"
                )
            else:
                return HTTPException(
                    status_code=400,
                    detail="Data integrity constraint violated"
                )
        else:
            return HTTPException(
                status_code=500,
                detail="Database operation failed"
            )
    
    @staticmethod
    def handle_validation_error(error: ValidationError, operation: str) -> HTTPException:
        """Handle validation errors"""
        logger.error(f"Validation error during {operation}: {str(error)}")
        
        error_details = []
        for err in error.errors():
            field = " -> ".join(str(loc) for loc in err["loc"])
            error_details.append(f"{field}: {err['msg']}")
        
        return HTTPException(
            status_code=422,
            detail={
                "message": "Validation failed",
                "errors": error_details
            }
        )
    
    @staticmethod
    def handle_not_found_error(resource: str, resource_id: Any) -> HTTPException:
        """Handle resource not found errors"""
        logger.warning(f"{resource} with ID {resource_id} not found")
        return HTTPException(
            status_code=404,
            detail=f"{resource} not found"
        )
    
    @staticmethod
    def handle_permission_error(operation: str, required_role: str = None) -> HTTPException:
        """Handle permission/authorization errors"""
        logger.warning(f"Permission denied for operation: {operation}")
        
        if required_role:
            return HTTPException(
                status_code=403,
                detail=f"Access denied. {required_role} role required for this operation."
            )
        else:
            return HTTPException(
                status_code=403,
                detail="Access denied. Insufficient permissions for this operation."
            )
    
    @staticmethod
    def handle_business_logic_error(message: str, operation: str) -> HTTPException:
        """Handle business logic errors"""
        logger.warning(f"Business logic error during {operation}: {message}")
        return HTTPException(
            status_code=400,
            detail=message
        )
    
    @staticmethod
    def handle_external_service_error(service: str, operation: str, error: Exception) -> HTTPException:
        """Handle external service errors"""
        logger.error(f"External service error ({service}) during {operation}: {str(error)}")
        return HTTPException(
            status_code=503,
            detail=f"External service temporarily unavailable"
        )
    
    @staticmethod
    def handle_generic_error(error: Exception, operation: str) -> HTTPException:
        """Handle generic/unexpected errors"""
        logger.error(f"Unexpected error during {operation}: {str(error)}", exc_info=True)
        return HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )

def safe_execute(operation: str, func, *args, **kwargs) -> Any:
    """
    Safely execute a function with comprehensive error handling
    
    Args:
        operation: Description of the operation being performed
        func: Function to execute
        *args, **kwargs: Arguments to pass to the function
    
    Returns:
        Function result if successful
    
    Raises:
        HTTPException: Appropriate HTTP exception based on error type
    """
    try:
        return func(*args, **kwargs)
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except SQLAlchemyError as e:
        raise ErrorHandler.handle_database_error(e, operation)
    except ValidationError as e:
        raise ErrorHandler.handle_validation_error(e, operation)
    except ValueError as e:
        raise ErrorHandler.handle_business_logic_error(str(e), operation)
    except Exception as e:
        raise ErrorHandler.handle_generic_error(e, operation) 