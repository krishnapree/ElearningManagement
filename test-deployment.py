#!/usr/bin/env python3
"""
Test script to verify EduFlow LMS deployment fixes
Run this to test the backend API endpoints locally
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "http://localhost:8000"  # Change to your deployed URL for testing
FRONTEND_URL = "http://localhost:5173"  # Change to your deployed URL for testing

def test_endpoint(url, description):
    """Test a single endpoint and return results"""
    try:
        print(f"Testing {description}...")
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"  ✅ SUCCESS: {description}")
                return True, data
            except json.JSONDecodeError:
                print(f"  ❌ FAILED: {description} - Invalid JSON response")
                return False, None
        else:
            print(f"  ❌ FAILED: {description} - HTTP {response.status_code}")
            return False, None
            
    except requests.exceptions.RequestException as e:
        print(f"  ❌ FAILED: {description} - Connection error: {e}")
        return False, None

def test_backend():
    """Test all backend endpoints"""
    print("🔧 Testing Backend API...")
    print("=" * 50)
    
    tests = [
        (f"{BACKEND_URL}/api/health", "Health Check"),
        (f"{BACKEND_URL}/api/test", "Test Endpoint"),
        (f"{BACKEND_URL}/api/dashboard?role=admin", "Admin Dashboard"),
        (f"{BACKEND_URL}/api/dashboard?role=lecturer", "Lecturer Dashboard"),
        (f"{BACKEND_URL}/api/dashboard?role=student", "Student Dashboard"),
    ]
    
    results = []
    for url, description in tests:
        success, data = test_endpoint(url, description)
        results.append((description, success, data))
        
        if success and data:
            if "database_users" in data:
                print(f"    📊 Database users: {data['database_users']}")
            if "environment" in data:
                print(f"    🌍 Environment: {data['environment']}")
            if "total_students" in data:
                print(f"    👥 Total students: {data['total_students']}")
    
    return results

def test_cors():
    """Test CORS configuration"""
    print("\n🌐 Testing CORS Configuration...")
    print("=" * 50)
    
    try:
        # Test preflight request
        response = requests.options(
            f"{BACKEND_URL}/api/health",
            headers={
                "Origin": FRONTEND_URL,
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Content-Type"
            },
            timeout=10
        )
        
        if response.status_code in [200, 204]:
            cors_headers = {
                "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
                "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
                "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
            }
            
            print("  ✅ CORS preflight successful")
            for header, value in cors_headers.items():
                if value:
                    print(f"    {header}: {value}")
            return True
        else:
            print(f"  ❌ CORS preflight failed - HTTP {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"  ❌ CORS test failed - Connection error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 EduFlow LMS Deployment Test")
    print("=" * 50)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"Test time: {datetime.now().isoformat()}")
    print()
    
    # Test backend endpoints
    backend_results = test_backend()
    
    # Test CORS
    cors_success = test_cors()
    
    # Summary
    print("\n📊 Test Summary")
    print("=" * 50)
    
    backend_success_count = sum(1 for _, success, _ in backend_results if success)
    total_backend_tests = len(backend_results)
    
    print(f"Backend Tests: {backend_success_count}/{total_backend_tests} passed")
    print(f"CORS Test: {'✅ PASSED' if cors_success else '❌ FAILED'}")
    
    if backend_success_count == total_backend_tests and cors_success:
        print("\n🎉 All tests passed! Deployment should work correctly.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
