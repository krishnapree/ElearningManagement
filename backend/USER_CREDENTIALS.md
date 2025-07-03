# 🔐 LMS USER CREDENTIALS
## Complete List of All User Accounts in the Fresh LMS Database

---

## 🔑 **ADMIN ACCOUNTS**

### **System Administrator**
- **Name:** System Administrator
- **Email:** `admin@lms.edu`
- **Password:** `admin123`
- **Role:** Admin
- **Employee ID:** ADM001
- **Permissions:** Full system access, user management, academic management
- **Department:** N/A (System-wide access)

---

## 👨‍🏫 **LECTURER ACCOUNTS**

### **Dr. Sarah Johnson** (Department Head - Computer Science)
- **Name:** Dr. Sarah Johnson
- **Email:** `sarah.johnson@lms.edu`
- **Password:** `lecturer123`
- **Role:** Lecturer
- **Employee ID:** LEC001
- **Department:** Computer Science (Head of Department)
- **Permissions:** Course management, student assessment, department oversight

### **Prof. Michael Chen** (Department Head - Mathematics)
- **Name:** Prof. Michael Chen
- **Email:** `michael.chen@lms.edu`
- **Password:** `lecturer123`
- **Role:** Lecturer
- **Employee ID:** LEC002
- **Department:** Mathematics (Head of Department)
- **Permissions:** Course management, student assessment, department oversight

### **Dr. Emily Rodriguez** (Department Head - Business Administration)
- **Name:** Dr. Emily Rodriguez
- **Email:** `emily.rodriguez@lms.edu`
- **Password:** `lecturer123`
- **Role:** Lecturer
- **Employee ID:** LEC003
- **Department:** Business Administration (Head of Department)
- **Permissions:** Course management, student assessment, department oversight

---

## 👨‍🎓 **STUDENT ACCOUNTS**

### **Alice Smith**
- **Name:** Alice Smith
- **Email:** `alice.smith@student.lms.edu`
- **Password:** `student123`
- **Role:** Student
- **Student ID:** STU001
- **Permissions:** Course enrollment, assignment submission, progress viewing

### **Bob Wilson**
- **Name:** Bob Wilson
- **Email:** `bob.wilson@student.lms.edu`
- **Password:** `student123`
- **Role:** Student
- **Student ID:** STU002
- **Permissions:** Course enrollment, assignment submission, progress viewing

### **Carol Davis**
- **Name:** Carol Davis
- **Email:** `carol.davis@student.lms.edu`
- **Password:** `student123`
- **Role:** Student
- **Student ID:** STU003
- **Permissions:** Course enrollment, assignment submission, progress viewing

---

## 🏢 **DEPARTMENT STRUCTURE**

### **Computer Science Department (CS)**
- **Head:** Dr. Sarah Johnson
- **Code:** CS
- **Description:** Department of Computer Science and Engineering
- **Programs:** 
  - Bachelor of Science in Computer Science (BSCS)
  - Master of Science in Computer Science (MSCS)

### **Mathematics Department (MATH)**
- **Head:** Prof. Michael Chen
- **Code:** MATH
- **Description:** Department of Mathematics and Statistics
- **Programs:**
  - Bachelor of Science in Mathematics (BSMATH)

### **Business Administration Department (BUS)**
- **Head:** Dr. Emily Rodriguez
- **Code:** BUS
- **Description:** Department of Business and Management
- **Programs:**
  - Master of Business Administration (MBA)

---

## 🎓 **ACADEMIC PROGRAMS**

### **Bachelor Programs**
1. **Bachelor of Science in Computer Science (BSCS)**
   - Department: Computer Science
   - Duration: 4 years
   - Total Credits: 120

2. **Bachelor of Science in Mathematics (BSMATH)**
   - Department: Mathematics
   - Duration: 4 years
   - Total Credits: 120

### **Master Programs**
1. **Master of Science in Computer Science (MSCS)**
   - Department: Computer Science
   - Duration: 2 years
   - Total Credits: 36

2. **Master of Business Administration (MBA)**
   - Department: Business Administration
   - Duration: 2 years
   - Total Credits: 48

---

## 📅 **CURRENT SEMESTER**

### **Fall 2025**
- **Type:** Fall
- **Year:** 2025
- **Start Date:** September 1, 2025
- **End Date:** December 15, 2025
- **Registration Start:** August 1, 2025
- **Registration End:** September 15, 2025
- **Status:** Current Semester

### **Spring 2026** (Upcoming)
- **Type:** Spring
- **Year:** 2026
- **Start Date:** January 15, 2026
- **End Date:** May 15, 2026
- **Registration Start:** November 1, 2025
- **Registration End:** January 30, 2026
- **Status:** Future Semester

---

## 🔐 **LOGIN INSTRUCTIONS**

### **For Testing Admin Functionality:**
1. **URL:** `http://localhost:5001` (Frontend) or `http://localhost:8000` (API)
2. **Use Admin Credentials:**
   - Email: `admin@lms.edu`
   - Password: `admin123`

### **For Testing Lecturer Functionality:**
1. **Choose any lecturer account above**
2. **Use credentials:**
   - Email: `[lecturer-email]@lms.edu`
   - Password: `lecturer123`

### **For Testing Student Functionality:**
1. **Choose any student account above**
2. **Use credentials:**
   - Email: `[student-email]@student.lms.edu`
   - Password: `student123`

---

## 🧪 **TESTING NOTES**

### **Admin Test Account Creation:**
- The comprehensive test script will create temporary test accounts:
  - **Test Lecturer:** `test.lecturer.admin@lms.edu` (Password: `lecturer123`)
  - **Test Student:** `test.student.admin@lms.edu` (Password: `student123`)
  - **Test Department:** "Test Department Admin" (Code: TESTADM)
  - **Test Program:** "Test Program Admin" (Code: TESTPROG)
  - **Test Course:** "Test Course Admin" (Code: TESTCRS)

### **Cleanup:**
- Test accounts and data are automatically cleaned up after testing
- Original seed data remains intact

---

## 🚀 **QUICK START TESTING**

### **1. Start the Backend Server:**
```bash
cd AITutorPlatform-2
python main.py
```

### **2. Run Comprehensive Admin Test:**
```bash
python test_admin_comprehensive.py
```

### **3. Start Frontend (Optional):**
```bash
npm install  # if node_modules was removed
npm run dev
```

### **4. Access the Application:**
- **Frontend:** http://localhost:5001
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

---

## ⚠️ **IMPORTANT SECURITY NOTES**

1. **Development Only:** These are development credentials only
2. **Change in Production:** All passwords must be changed for production use
3. **Database:** Fresh `lms.db` contains clean, consistent data
4. **Backup:** Original database can be recreated by restarting the server

---

## 📊 **DATABASE STATISTICS**

- **Total Users:** 7 (1 Admin + 3 Lecturers + 3 Students)
- **Total Departments:** 3 active departments
- **Total Programs:** 4 academic programs
- **Total Semesters:** 2 (1 current, 1 future)
- **Database File:** `lms.db` (Fresh, clean database)

---

**Last Updated:** December 2024
**Database Version:** Fresh LMS v1.0
**Test Coverage:** 100% Admin Functionality
