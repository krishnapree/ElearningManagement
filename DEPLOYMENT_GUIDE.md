# 🚀 EduFlow LMS - Production Deployment Guide

## 📋 **Issues Fixed**

### **1. Frontend SPA Routing (404 Errors)**
- ✅ Added proper `static.json` configuration for Render
- ✅ Configured fallback routing to `index.html`
- ✅ Added 404 error page and error boundary
- ✅ Fixed React Router configuration

### **2. CORS Configuration**
- ✅ Updated backend CORS origins to include production URLs
- ✅ Added proper headers and methods configuration
- ✅ Configured for both development and production

### **3. API Client Configuration**
- ✅ Fixed frontend API client for production environment
- ✅ Added environment variable support
- ✅ Configured proper API base URL handling

### **4. Build Configuration**
- ✅ Fixed Vite configuration for production builds
- ✅ Updated package.json build scripts
- ✅ Added proper static file handling

### **5. Health Check Endpoint**
- ✅ Added `/api/health` endpoint for monitoring
- ✅ Added root endpoint with API information

## 🛠️ **Deployment Steps**

### **Step 1: Update Backend URL in Frontend**

1. **Update API Client Configuration:**
   ```typescript
   // In frontend/src/api/client.ts
   const API_BASE = import.meta.env.VITE_API_URL || 
     (import.meta.env.PROD ? "https://YOUR-BACKEND-URL.onrender.com/api" : "/api");
   ```

2. **Update Environment Variables:**
   ```bash
   # In frontend/.env.production
   VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com/api
   ```

3. **Update Render Configuration:**
   ```yaml
   # In render.yaml
   envVars:
     - key: VITE_API_URL
       value: https://YOUR-BACKEND-URL.onrender.com/api
   ```

### **Step 2: Update Backend CORS Configuration**

1. **Update CORS Origins:**
   ```python
   # In backend/main.py
   origins = [
       "https://YOUR-FRONTEND-URL.onrender.com",  # Your actual frontend domain
       "http://localhost:5173",                   # For local dev
       "http://localhost:3000",                   # Alternative local dev port
   ]
   ```

### **Step 3: Deploy Backend First**

1. **Deploy Backend to Render:**
   - Use the updated `render.yaml` configuration
   - Set environment variables in Render dashboard:
     - `GEMINI_API_KEY`: Your Google Gemini API key
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `JWT_SECRET_KEY`: Generate a secure secret key

2. **Verify Backend Deployment:**
   - Check health endpoint: `https://YOUR-BACKEND-URL.onrender.com/api/health`
   - Verify API docs: `https://YOUR-BACKEND-URL.onrender.com/docs`

### **Step 4: Deploy Frontend**

1. **Update Frontend Configuration:**
   - Replace `YOUR-BACKEND-URL` with actual backend URL in all files
   - Ensure environment variables are set correctly

2. **Deploy Frontend to Render:**
   - Use static site deployment
   - Ensure `static.json` is copied to dist folder during build

### **Step 5: Verify Deployment**

1. **Test Frontend Routes:**
   - Home page: `https://YOUR-FRONTEND-URL.onrender.com/`
   - Dashboard: `https://YOUR-FRONTEND-URL.onrender.com/dashboard`
   - Role-specific pages should work without 404 errors

2. **Test API Communication:**
   - Select a role from home page
   - Navigate to dashboard
   - Verify API calls work correctly

## 🔧 **Environment Variables**

### **Backend (Render Dashboard) - Demo Mode**
```bash
DATABASE_URL=sqlite:///./lms.db
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
ENVIRONMENT=production
CORS_ORIGINS=https://your-frontend-url.onrender.com,http://localhost:5173
```

**Note**: JWT_SECRET_KEY is not required for demo mode since there's no real authentication.

### **Frontend (Render Dashboard)**
```bash
VITE_API_URL=https://YOUR-BACKEND-URL.onrender.com/api
VITE_NODE_ENV=production
```

## 🚨 **Important Notes**

1. **Replace Placeholder URLs:**
   - Update all instances of `YOUR-BACKEND-URL` and `YOUR-FRONTEND-URL`
   - Use actual Render service URLs

2. **Security:**
   - Remove wildcard CORS origin (`"*"`) in production
   - Use strong JWT secret key
   - Keep API keys secure

3. **Monitoring:**
   - Use health check endpoint for monitoring
   - Check Render logs for any issues

## 🔍 **Troubleshooting**

### **If 404 Errors Persist:**
1. Check `static.json` is in the dist folder
2. Verify Render static site configuration
3. Check browser network tab for failed requests

### **If API Calls Fail:**
1. Verify CORS configuration
2. Check environment variables
3. Ensure backend is running and accessible

### **If Role Selection Doesn't Work:**
1. Check localStorage in browser dev tools
2. Verify authentication flow
3. Check console for JavaScript errors

## ✅ **Success Criteria**

After deployment, you should be able to:
- ✅ Access the home page without errors
- ✅ Select any role (Admin, Lecturer, Student)
- ✅ Navigate to dashboard and see role-specific content
- ✅ Access all role-specific pages without 404 errors
- ✅ Use AI features (Ask, Quiz, etc.)
- ✅ Navigate between pages smoothly
