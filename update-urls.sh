#!/bin/bash

# EduFlow LMS - URL Update Script
# This script updates placeholder URLs with your actual Render service URLs

echo "🔧 EduFlow LMS - URL Update Script"
echo "=================================="

# Check if URLs are provided
if [ $# -ne 2 ]; then
    echo "Usage: $0 <backend-url> <frontend-url>"
    echo "Example: $0 https://eduflow-backend.onrender.com https://eduflow-frontend.onrender.com"
    exit 1
fi

BACKEND_URL=$1
FRONTEND_URL=$2

echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Update frontend API client
echo "📝 Updating frontend API client..."
sed -i.bak "s|https://your-backend-url.onrender.com|$BACKEND_URL|g" frontend/src/api/client.ts

# Update frontend environment files
echo "📝 Updating frontend environment files..."
sed -i.bak "s|https://your-backend-url.onrender.com|$BACKEND_URL|g" frontend/.env.production
sed -i.bak "s|https://your-backend-url.onrender.com|$BACKEND_URL|g" frontend/.env.example

# Update backend CORS configuration
echo "📝 Updating backend CORS configuration..."
sed -i.bak "s|https://your-frontend-url.onrender.com|$FRONTEND_URL|g" backend/main.py

# Update render.yaml
echo "📝 Updating render.yaml configuration..."
sed -i.bak "s|https://eduflow-backend.onrender.com|$BACKEND_URL|g" render.yaml

# Clean up backup files
echo "🧹 Cleaning up backup files..."
find . -name "*.bak" -delete

echo ""
echo "✅ URLs updated successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Commit and push these changes to your repository"
echo "2. Deploy backend service first"
echo "3. Deploy frontend service"
echo "4. Test the application"
echo ""
echo "🔍 Verify these files were updated:"
echo "- frontend/src/api/client.ts"
echo "- frontend/.env.production"
echo "- backend/main.py"
echo "- render.yaml"
