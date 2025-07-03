"""
Input validation utilities for security and data integrity
"""
import re
import html
from typing import Any, Dict, List, Optional
from fastapi import HTTPException


class InputValidator:
    """Utility class for input validation and sanitization"""
    
    # Maximum lengths for different field types
    MAX_LENGTHS = {
        'name': 100,
        'email': 255,
        'title': 200,
        'description': 2000,
        'content': 10000,
        'code': 20,
        'short_text': 500,
        'medium_text': 1000,
        'long_text': 5000,
        'url': 2048,
        'phone': 20,
        'address': 500
    }
    
    # Patterns for validation
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    PHONE_PATTERN = re.compile(r'^\+?[\d\s\-\(\)]{10,20}$')
    ALPHANUMERIC_PATTERN = re.compile(r'^[a-zA-Z0-9\s\-_]+$')
    CODE_PATTERN = re.compile(r'^[A-Z0-9\-_]{2,20}$')
    
    # XSS patterns to detect
    XSS_PATTERNS = [
        re.compile(r'<script[^>]*>.*?</script>', re.IGNORECASE | re.DOTALL),
        re.compile(r'javascript:', re.IGNORECASE),
        re.compile(r'on\w+\s*=', re.IGNORECASE),
        re.compile(r'<iframe[^>]*>', re.IGNORECASE),
        re.compile(r'<object[^>]*>', re.IGNORECASE),
        re.compile(r'<embed[^>]*>', re.IGNORECASE),
        re.compile(r'<link[^>]*>', re.IGNORECASE),
        re.compile(r'<meta[^>]*>', re.IGNORECASE),
    ]
    
    @classmethod
    def sanitize_html(cls, text: str) -> str:
        """Sanitize HTML content to prevent XSS attacks"""
        if not isinstance(text, str):
            return text
            
        # HTML encode special characters
        sanitized = html.escape(text)
        
        # Remove any remaining dangerous patterns
        for pattern in cls.XSS_PATTERNS:
            sanitized = pattern.sub('', sanitized)
            
        return sanitized
    
    @classmethod
    def validate_length(cls, value: str, field_type: str, field_name: str = None) -> str:
        """Validate string length against maximum allowed"""
        if not isinstance(value, str):
            return value
            
        max_length = cls.MAX_LENGTHS.get(field_type, 1000)
        
        if len(value) > max_length:
            field_display = field_name or field_type
            raise HTTPException(
                status_code=400,
                detail=f"{field_display} exceeds maximum length of {max_length} characters"
            )
            
        return value
    
    @classmethod
    def validate_email(cls, email: str) -> str:
        """Validate email format"""
        if not isinstance(email, str):
            raise HTTPException(status_code=400, detail="Email must be a string")
            
        email = email.strip().lower()
        
        if not cls.EMAIL_PATTERN.match(email):
            raise HTTPException(status_code=400, detail="Invalid email format")
            
        return cls.validate_length(email, 'email', 'Email')
    
    @classmethod
    def validate_phone(cls, phone: str) -> str:
        """Validate phone number format"""
        if not isinstance(phone, str):
            raise HTTPException(status_code=400, detail="Phone must be a string")
            
        phone = phone.strip()
        
        if not cls.PHONE_PATTERN.match(phone):
            raise HTTPException(status_code=400, detail="Invalid phone number format")
            
        return cls.validate_length(phone, 'phone', 'Phone number')
    
    @classmethod
    def validate_code(cls, code: str, field_name: str = "Code") -> str:
        """Validate code format (course codes, department codes, etc.)"""
        if not isinstance(code, str):
            raise HTTPException(status_code=400, detail=f"{field_name} must be a string")
            
        code = code.strip().upper()
        
        if not cls.CODE_PATTERN.match(code):
            raise HTTPException(
                status_code=400, 
                detail=f"{field_name} must contain only letters, numbers, hyphens, and underscores"
            )
            
        return cls.validate_length(code, 'code', field_name)
    
    @classmethod
    def validate_required_string(cls, value: Any, field_name: str, field_type: str = 'medium_text') -> str:
        """Validate that a required string field is present and valid"""
        if not value:
            raise HTTPException(status_code=400, detail=f"{field_name} is required")
            
        if not isinstance(value, str):
            raise HTTPException(status_code=400, detail=f"{field_name} must be a string")
            
        value = value.strip()
        if not value:
            raise HTTPException(status_code=400, detail=f"{field_name} cannot be empty")
            
        # Sanitize and validate length
        value = cls.sanitize_html(value)
        value = cls.validate_length(value, field_type, field_name)
        
        return value
    
    @classmethod
    def validate_optional_string(cls, value: Any, field_name: str, field_type: str = 'medium_text') -> Optional[str]:
        """Validate an optional string field"""
        if not value:
            return None
            
        if not isinstance(value, str):
            raise HTTPException(status_code=400, detail=f"{field_name} must be a string")
            
        value = value.strip()
        if not value:
            return None
            
        # Sanitize and validate length
        value = cls.sanitize_html(value)
        value = cls.validate_length(value, field_type, field_name)
        
        return value
    
    @classmethod
    def validate_integer(cls, value: Any, field_name: str, min_val: int = None, max_val: int = None) -> int:
        """Validate integer field with optional min/max constraints"""
        if value is None:
            raise HTTPException(status_code=400, detail=f"{field_name} is required")
            
        try:
            value = int(value)
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail=f"{field_name} must be an integer")
            
        if min_val is not None and value < min_val:
            raise HTTPException(status_code=400, detail=f"{field_name} must be at least {min_val}")
            
        if max_val is not None and value > max_val:
            raise HTTPException(status_code=400, detail=f"{field_name} must be at most {max_val}")
            
        return value
    
    @classmethod
    def validate_float(cls, value: Any, field_name: str, min_val: float = None, max_val: float = None) -> float:
        """Validate float field with optional min/max constraints"""
        if value is None:
            raise HTTPException(status_code=400, detail=f"{field_name} is required")
            
        try:
            value = float(value)
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail=f"{field_name} must be a number")
            
        if min_val is not None and value < min_val:
            raise HTTPException(status_code=400, detail=f"{field_name} must be at least {min_val}")
            
        if max_val is not None and value > max_val:
            raise HTTPException(status_code=400, detail=f"{field_name} must be at most {max_val}")
            
        return value
    
    @classmethod
    def validate_request_data(cls, request: Dict[str, Any], validation_rules: Dict[str, Dict]) -> Dict[str, Any]:
        """Validate entire request data against validation rules
        
        Args:
            request: The request data dictionary
            validation_rules: Dictionary of field validation rules
                Format: {
                    'field_name': {
                        'type': 'string|integer|float|email|phone|code',
                        'required': True|False,
                        'field_type': 'name|email|title|description|etc',
                        'min_val': number (for integers/floats),
                        'max_val': number (for integers/floats)
                    }
                }
        
        Returns:
            Validated and sanitized request data
        """
        validated_data = {}
        
        for field_name, rules in validation_rules.items():
            value = request.get(field_name)
            field_type = rules.get('type', 'string')
            required = rules.get('required', False)
            
            if field_type == 'string':
                if required:
                    validated_data[field_name] = cls.validate_required_string(
                        value, field_name, rules.get('field_type', 'medium_text')
                    )
                else:
                    validated_data[field_name] = cls.validate_optional_string(
                        value, field_name, rules.get('field_type', 'medium_text')
                    )
            elif field_type == 'email':
                if required or value:
                    validated_data[field_name] = cls.validate_email(value)
            elif field_type == 'phone':
                if required or value:
                    validated_data[field_name] = cls.validate_phone(value)
            elif field_type == 'code':
                if required or value:
                    validated_data[field_name] = cls.validate_code(value, field_name)
            elif field_type == 'integer':
                if required or value is not None:
                    validated_data[field_name] = cls.validate_integer(
                        value, field_name, rules.get('min_val'), rules.get('max_val')
                    )
            elif field_type == 'float':
                if required or value is not None:
                    validated_data[field_name] = cls.validate_float(
                        value, field_name, rules.get('min_val'), rules.get('max_val')
                    )
            else:
                # Default: treat as optional string
                validated_data[field_name] = cls.validate_optional_string(value, field_name)
        
        return validated_data


def validate_user_registration(request: Dict[str, Any]) -> Dict[str, Any]:
    """Validate user registration data"""
    rules = {
        'first_name': {'type': 'string', 'required': True, 'field_type': 'name'},
        'last_name': {'type': 'string', 'required': True, 'field_type': 'name'},
        'email': {'type': 'email', 'required': True},
        'password': {'type': 'string', 'required': True, 'field_type': 'medium_text'},
        'phone': {'type': 'phone', 'required': False},
        'student_id': {'type': 'code', 'required': False}
    }
    return InputValidator.validate_request_data(request, rules)


def validate_course_creation(request: Dict[str, Any]) -> Dict[str, Any]:
    """Validate course creation data"""
    rules = {
        'name': {'type': 'string', 'required': True, 'field_type': 'title'},
        'code': {'type': 'code', 'required': True},
        'description': {'type': 'string', 'required': False, 'field_type': 'description'},
        'credits': {'type': 'integer', 'required': True, 'min_val': 1, 'max_val': 10},
        'max_capacity': {'type': 'integer', 'required': False, 'min_val': 1, 'max_val': 500},
        'prerequisites': {'type': 'string', 'required': False, 'field_type': 'medium_text'},
        'syllabus': {'type': 'string', 'required': False, 'field_type': 'long_text'}
    }
    return InputValidator.validate_request_data(request, rules)


def validate_assignment_creation(request: Dict[str, Any]) -> Dict[str, Any]:
    """Validate assignment creation data"""
    rules = {
        'title': {'type': 'string', 'required': True, 'field_type': 'title'},
        'description': {'type': 'string', 'required': False, 'field_type': 'description'},
        'instructions': {'type': 'string', 'required': False, 'field_type': 'long_text'},
        'max_points': {'type': 'integer', 'required': False, 'min_val': 1, 'max_val': 1000},
        'assignment_type': {'type': 'string', 'required': False, 'field_type': 'short_text'}
    }
    return InputValidator.validate_request_data(request, rules)
