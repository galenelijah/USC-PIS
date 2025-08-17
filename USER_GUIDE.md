# USC-PIS User Guide

[![System Status](https://img.shields.io/badge/Status-Fully%20Operational-green)]()
[![Version](https://img.shields.io/badge/Version-August%202025-blue)]()
[![Users](https://img.shields.io/badge/Active%20Users-7-green)]()

## 🆕 Latest Updates (August 17, 2025)

### **✅ Major System Achievements**
- **✅ Enterprise-Grade Backup System**: Complete execution engine with smart restore capabilities and performance optimization
- **✅ Data Recovery System**: Intelligent conflict detection with merge strategies (replace, merge, skip) and preview functionality
- **✅ Performance Optimization**: Quick backup option for 50%+ faster completion (~42-46 seconds for database backups)
- **✅ Backup Download/Upload**: Secure file access for admins with automatic packaging (JSON, ZIP formats)
- **✅ Administrative Interfaces**: All database monitor and backup management systems fully operational
- **✅ Email Notification System**: AWS SES configured with automated communications and professional templates
- **✅ Media Storage System**: Cloudinary integrated with CDN delivery and persistent storage
- **✅ Enhanced Dashboard**: Campaigns & announcements integration on home page
- **✅ Advanced Validation**: Comprehensive date validation across all forms (prevents future dates)
- **✅ Student Specialization**: Dedicated medical vs dental record interfaces
- **✅ Smart Search**: USC ID search across all medical forms
- **✅ Export System**: Professional CSV/PDF export capabilities
- **✅ Clinical Safety**: Allergy alerts and medication tracking features

### **🎯 SYSTEM STATUS (August 17, 2025)**
**All critical infrastructure issues resolved - System ready for healthcare feature development**

### **🚀 Next Development Phase - Healthcare Systems**

#### **🏥 CORE HEALTHCARE SYSTEMS (Current Priority)**
- **Appointment/Scheduling System**: **HIGH PRIORITY** - Complete patient booking, provider calendars, appointment management *(Dashboard currently shows "appointments today" but no appointment system exists)*
- **Inventory Management System**: Medical supplies tracking, medication management, stock alerts
- **Enhanced Billing System**: Comprehensive financial management beyond basic cost tracking

#### **🏥 CORE HEALTHCARE SYSTEMS (Week 3-6)**
- **Inventory Management System**: Medical supplies tracking, medication management, stock alerts
- **Billing & Financial Management**: Comprehensive patient billing, insurance processing, payment tracking

#### **⚡ USER EXPERIENCE ENHANCEMENTS (Week 7+ - After Core Systems Stable)**
- **Role-Based ID System**: Students will use numeric IDs, staff will use alphanumeric IDs *(moved to Phase 2)*
- **In-App Notifications**: Real-time notification center with appointment reminders and updates *(moved to Phase 2)*
- **Enhanced Feedback Automation**: Multi-channel feedback prompts *(moved to Phase 2)*

**📊 Reference**: See **[CURRENT_PRIORITIES_ROADMAP.md](CURRENT_PRIORITIES_ROADMAP.md)** for complete implementation details.

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Email Notifications](#email-notifications)
4. [User Roles](#user-roles)
5. [Main Features](#main-features)
6. [Common Tasks](#common-tasks)
7. [Form Validation Guide](#form-validation-guide)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Support](#support)

## Introduction

Welcome to the USC Patient Information System (USC-PIS). This comprehensive guide will help you navigate and effectively use the system. USC-PIS is designed to streamline patient information management, medical record keeping, and appointment scheduling within the university clinic.

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection
- Screen resolution of 1280x720 or higher

### Accessing the System
1. **Visit**: [usc-pis.herokuapp.com](https://usc-pis.herokuapp.com)
2. **Login**: Click "Login" in the top right corner
3. **Credentials**: Enter your USC email and password
4. **Options**: Select "Remember me" for convenience (optional)
5. **Sign In**: Click "Sign In" to access the system

### First-Time Setup
1. Upon first login, you'll be prompted to complete your profile using a multi-step form.
2. Fill in all required information marked with an asterisk (*).
3. Patient records are created only after you complete the profile setup, not at registration.
4. Upload a profile photo (optional).
5. Click "Save" to complete setup.
6. After successful setup, you will be redirected to the dashboard.

## Email Notifications

USC-PIS includes a comprehensive email notification system to keep you informed about important system activities and healthcare updates.

### **Automatic Email Notifications**

#### **Welcome Email** 📧
- **When**: Automatically sent when you create a new account
- **Content**: System welcome message, overview of features, and next steps
- **Action Required**: None - informational only

#### **Medical Certificate Notifications** 🏥
- **Certificate Request Confirmation**: Sent immediately when you submit a medical certificate request
- **Approval Notifications**: Sent when your certificate is approved by a doctor
- **Status Updates**: Notifications for any changes to your certificate status

#### **Feedback Requests** 💭
- **When**: Sent 24 hours after your medical visit
- **Purpose**: Collect your feedback to improve healthcare services
- **Content**: Quick rating buttons and link to detailed feedback form
- **Action**: Optional - helps improve clinic services

#### **Password Reset** 🔒
- **When**: Sent when you request a password reset
- **Content**: Secure link to reset your password (valid for 24 hours)
- **Action Required**: Click the link to reset your password

### **Email Features**

#### **Professional Design**
- All emails feature USC-PIS branding and professional formatting
- Mobile-responsive design works on all devices
- Clear, easy-to-read layouts with important information highlighted

#### **Security & Privacy**
- All email links are secure and expire after 24 hours
- Emails are sent only to your registered USC email address
- No sensitive medical information is included in emails

#### **One-Click Actions**
- Feedback emails include quick rating buttons (⭐⭐⭐⭐⭐)
- Password reset with single-click secure links
- Direct links to relevant system pages

### **Email Settings & Preferences**

#### **Checking Your Email**
- Check your USC email inbox regularly for important notifications
- Look in your spam/junk folder if you don't receive expected emails
- All emails are sent from `noreply@usc-pis.herokuapp.com`

#### **Email Delivery Issues**
If you're not receiving emails:
1. **Check Spam Folder**: Automated emails sometimes go to spam
2. **Verify Email Address**: Ensure your profile has the correct USC email
3. **Contact Support**: Email support if you continue having issues

#### **Types of Emails You'll Receive**
- ✅ **Registration Welcome** (once, when you first sign up)
- ✅ **Certificate Updates** (when status changes occur)
- ✅ **Feedback Requests** (24 hours after medical visits)
- ✅ **Password Reset** (only when requested)
- ✅ **Important System Updates** (rarely, for major announcements)

### **Email Etiquette & Best Practices**

#### **Responding to Feedback Requests**
- Feedback helps improve healthcare services for all students
- Your responses are confidential and help the clinic provide better care
- Takes only 2-3 minutes to complete

#### **Password Reset Security**
- Never share password reset links with others
- Reset links expire in 24 hours for security
- Contact support if you didn't request a password reset

#### **Staying Informed**
- Read welcome emails to learn about new features
- Keep your contact information updated in your profile
- Check email regularly for important healthcare notifications

## User Roles

**Important Update (July 24, 2025):** Doctor roles now have full administrative access identical to Staff and Admin users, ensuring consistent experience across all medical professionals.

### Student
- **Medical Records**: Access dedicated medical records page (`/health-records`) showing only medical visits
- **Dental Records**: Access dedicated dental records page (`/dental-records`) for dental care history  
- **Patient History**: Comprehensive view of all medical and dental records (`/medical-records`)
- **Medical Certificates**: Request and track medical certificates for school/work
- **Health Information**: Access health campaigns and wellness resources
- **Profile Management**: Update personal information and account settings

### Doctor
- **Full Administrative Access** (identical to Staff/Admin)
- View and manage all patient records
- Create and update medical records
- Manage appointments and consultations
- Issue prescriptions and medical certificates
- Access admin dashboard with system statistics
- View and manage feedback analytics
- Create and manage health information campaigns
- Access database monitoring tools
- Complete administrative menu access

### Nurse
- Register new patients
- Update patient information
- Manage appointments
- Record vital signs
- Assist with medical records
- Monitor inventory

### Staff
- Manage user accounts
- Generate reports
- System configuration
- Backup and restore data
- Monitor system usage

## Main Features

### Dashboard (Updated August 3, 2025)
- **Enhanced Layout**: New 8-4 column responsive layout for better space utilization
- **Quick Overview**: Statistics cards showing important metrics (patients, records, appointments)
- **Recent Activities**: Display of recent medical activities and updates
- **Campaigns & Announcements Side Section**: 
  - **Featured Campaigns**: Up to 3 featured health campaigns with icons, titles, categories, and descriptions
  - **Recent Announcements**: Up to 2 recent announcements with timestamps and content previews
  - **Visual Design**: Blue icons for campaigns, orange icons for announcements
  - **Quick Access**: "View All" buttons for detailed campaign/announcement views
- **Upcoming Appointments**: Next appointment details with date, time, and doctor information
- **Quick Actions**: Role-based action buttons for common tasks
- **Real-time Updates**: Refresh functionality to get latest dashboard data

### Medical Records
- **Revolutionary Tabbed Interface** (August 2025 Update)
- **Medical Records Tab**: Complete medical record management with advanced search and filtering
- **Dental Records Tab**: Comprehensive dental history with visual priority indicators
- **Health Insights Tab**: Personalized analytics with visit frequency and health trend analysis
- Add new medical and dental records with enhanced patient search
- Advanced search across diagnosis, treatment, medications, and clinical notes
- Export medical history to CSV format with professional formatting
- Date range filtering with Material-UI date pickers

### Appointments
- Schedule new appointments
- View upcoming appointments
- Cancel or reschedule
- Set reminders
- View appointment history

### Profile Management
- Update personal information
- Change password
- Manage notification preferences
- View activity history
- **Note:** If you have not completed your profile setup, you will be prompted to do so before accessing other features.

### Patient Feedback
- Submit feedback about clinic visits or general experience.
- Feedback helps improve clinic services.

### File Uploads
- Upload documents, images, or other files relevant to your health or clinic interactions.
- View and manage your uploaded files.

## Common Tasks

### Scheduling an Appointment
1. Click "Appointments" in the navigation menu
2. Select "New Appointment"
3. Choose preferred date and time
4. Select appointment type
5. Add any notes or special requirements
6. Click "Schedule" to confirm

### Updating Personal Information
1. Click your profile picture in the top right
2. Select "Profile Settings"
3. Update desired information
4. Click "Save Changes"

### Navigating the New Medical Records Interface (August 2025 Update)

#### **Using the Tabbed Interface**
1. Navigate to "Medical Records" to see the new three-tab interface
2. **Medical Records Tab**: 
   - View all medical records with enhanced search and filtering
   - Use advanced search across diagnosis, treatment, medications, and clinical notes
   - Apply date range filters using the professional date picker interface
   - Export medical history to CSV format with complete patient data
   - Create new medical records (medical staff only)
3. **Dental Records Tab**:
   - View dental procedures with visual priority indicators (Low/Medium/High/Urgent)
   - See pain levels displayed as star ratings (1-10 scale)
   - View cost information with insurance status indicators
   - Access affected teeth information and treatment notes
4. **Health Insights Tab** (All users):
   - **Summary Statistics**: View total records and recent activity (last 30 days)
   - **Visit Frequency Analysis**: See 6-month visit patterns with visual progress bars
   - **Common Conditions**: Identify recurring health issues and patterns
   - **Personalized Recommendations**: Get health advice based on your visit history

#### **Advanced Search and Filtering**
1. Use the unified search bar to find records across both medical and dental data
2. Apply date range filters:
   - Click the "From Date" and "To Date" fields
   - Select dates using the Material-UI date picker
   - View active filters as removable chips
   - Use "Clear Filters" to reset all applied filters
3. Search across multiple fields: patient names, diagnosis, treatment, medications, notes
4. View real-time results as you type

#### **Export and Print Features**
1. Click the "Export CSV" button to download your complete medical history
2. Files are automatically named with current date for easy organization
3. Exported data includes patient demographics, diagnosis, treatment, medications, and clinical notes

### Creating Medical Certificates with Smart Patient Search (August 2025 Update)

#### **Revolutionary Single-Step Patient Search**
Medical staff can now create medical certificates using an intuitive, professional patient search interface that eliminates the previous clunky two-step process.

#### **Using the Smart Search Interface**
1. Navigate to "Medical Certificates" → "Create New Certificate"
2. **Patient Search & Selection**:
   - Start typing in the "Search and Select Patient" field
   - **Multi-Field Search**: Search by patient name, email, USC ID, or ID number
   - **Real-Time Results**: See filtered results instantly as you type
   - **Professional Patient Cards**: View patient information with avatars, names, emails, and ID badges
   - **Visual Selection**: Click on the desired patient card to select

#### **Patient Search Tips**
- **Full Names**: Type first name, last name, or both (e.g., "John Doe", "John", or "Doe")
- **Email Addresses**: Use full or partial email addresses (e.g., "john.doe@usc.edu.ph" or "john.doe")
- **USC ID Numbers**: Enter USC ID for quick lookup (e.g., "USC2024001")
- **Alternative ID**: Use ID numbers when USC ID is not available
- **Partial Matching**: The system finds results even with partial information

#### **Selected Patient Confirmation**
- After selecting a patient, you'll see a green confirmation panel
- The panel displays: patient avatar, full name, email, USC ID, and alternative ID
- This ensures you've selected the correct patient before proceeding
- You can change your selection by typing in the search field again

#### **Professional Features**
- **Visual Patient Cards**: Each search result shows patient avatar, name, email, and ID badges
- **No More Steps**: Gone are the days of separate search → select → confirm steps
- **Error Prevention**: Clear visual confirmation prevents patient mix-ups
- **Fast Performance**: Instant search results with no server delays
- **Mobile Optimized**: Works perfectly on tablets and mobile devices

#### **For Different User Roles**
- **Doctors**: Can immediately set fitness status and approve certificates during creation
- **Staff/Admin**: Certificates automatically submitted for doctor approval after creation
- **All Roles**: Same professional search experience regardless of role

### Navigating Student Health Records (August 2025 Update)

Students now have a specialized health records interface designed specifically for personal medical history management.

#### **Medical Records Page (/health-records) - Students Only**
This page is exclusively for students and shows only medical records (no dental records).

**Key Features:**
1. **Health Insights Dashboard**:
   - Personalized health guidance with colored alert cards
   - Statistics showing total medical records and recent visit patterns
   - Direct link to dental records page for comprehensive care

2. **Quick Stats Overview**:
   - **Total Medical Records**: Shows your complete medical visit count
   - **Last 30 Days**: Recent medical visits for health tracking
   - **Last 90 Days**: Extended recent activity for trend analysis

3. **Quick Actions Panel**:
   - **Request Medical Certificate**: Direct link to certificate request form
   - **View Dental Records**: Navigate to dedicated dental records page
   - **Health Information**: Access wellness resources and health campaigns
   - **Export My Records**: Download your medical history as CSV file

4. **Medical Records Display**:
   - **Clean Accordion Interface**: Expandable cards for each medical visit
   - **Comprehensive Information**: Shows visit date, diagnosis, treatment, vital signs
   - **Vital Signs Section**: Professional display of blood pressure, temperature, pulse rate, respiratory rate
   - **Clinical Notes**: Treatment details, medications, and follow-up instructions
   - **Record Timestamps**: Creation dates for record tracking

#### **Patient History Page (/medical-records) - All Users**
This page provides the complete medical and dental history view.

**For Students:**
- **Page Title**: "Patient History" (simplified title)
- **Three-Tab Interface**: Medical Records, Dental Records, and Health Insights
- **Comprehensive Data**: Complete view of all medical and dental visits
- **Advanced Search**: Filter across all record types
- **Export Options**: Download complete health history

#### **Key Differences Between Pages**

| Feature | /health-records (Students) | /medical-records (All Users) |
|---------|---------------------------|------------------------------|
| **Purpose** | Medical records only | Complete health history |
| **Interface** | Single-page accordion | Three-tab interface |
| **Records Shown** | Medical visits only | Medical + Dental records |
| **Quick Actions** | Medical certificate, dental link | Advanced search, exports |
| **Target Audience** | Students only | All authenticated users |
| **Navigation** | "Medical Records" in sidebar | "Patient Medical History" in sidebar |

#### **Using the Student Medical Records Interface**

1. **Accessing Your Records**:
   - Click "Medical Records" in the sidebar (available to all students)
   - View your personalized health insights at the top
   - Review quick statistics for recent activity

2. **Reading Medical Records**:
   - Click on any visit date card to expand details
   - Review diagnosis, treatment, and clinical notes
   - Check vital signs in the professional blue-tinted section
   - Note any medications or follow-up instructions

3. **Quick Actions**:
   - Use "Request Medical Certificate" for school/work documentation
   - Click "View Dental Records" to see dental care history
   - Access "Health Information" for wellness resources
   - Export your records using "Export My Records" button

4. **Health Insights**:
   - Review personalized health guidance messages
   - Track your medical visit frequency
   - Get reminders about dental care if needed

#### **Troubleshooting Student Records**

**If your medical records don't appear:**
1. **Check Browser Console**: Press F12 and look for error messages
2. **Verify Patient Profile**: Ensure your student account is linked to a patient profile
3. **Contact Medical Staff**: Ask them to verify your patient records are properly linked
4. **Clear Browser Cache**: Refresh the page and try again

**If vital signs show "Not recorded" despite being entered:**
1. **Data Format Issue**: The system checks both direct fields and nested JSON format
2. **Medical Staff**: Can verify the data format in the admin interface
3. **Recent Records**: New records should automatically use the correct format

### Submitting Feedback (Patient/Student)
1. Click "Feedback" in the navigation sidebar.
2. You will see options to provide general feedback or feedback for a specific recent visit (if applicable).
3. Click "General Feedback" or the "Leave Feedback" button next to a specific visit.
4. Fill out the feedback form:
    - **Overall Experience:** Select a star rating (1-5).
    - **Staff Courteous? / Recommend Service?:** Answer Yes/No.
    - **Comments (optional):** Provide detailed comments about your experience.
    - **What could we improve? (optional):** Offer specific suggestions.
5. Click "Submit Feedback".

### Viewing Feedback Analytics (Admin/Staff/Doctor)
1. Click "Feedback" in the navigation sidebar.
2. You will be directed to the **Admin - Patient Feedback** page.
3. At the top, you will see the **Feedback Analytics Summary**:
    - **Total Feedback Entries:** The total number of feedback submissions.
    - **Average Rating:** The average star rating across all feedback.
    - **Rating Distribution Chart:** A bar chart showing the count for each star rating (1-5).
    - **Staff Courteous? / Recommend Service?:** Cards showing the counts for Yes, No, and unanswered responses.
4. Below the analytics, a table displays all individual feedback submissions.

**Note:** Doctors now have full access to the admin feedback analytics view, identical to staff and admin users.

### Changing Password
1. Go to Profile Settings
2. Click "Security"
3. Enter current password
4. Enter and confirm new password
5. Click "Update Password"

### Uploading a File
1. Click "File Uploads" in the navigation sidebar.
2. Under "Upload New File", click the area to select a file or drag and drop a file onto it.
3. Optionally, add a description for the file in the text box.
4. Click "Upload File".
5. A success message will appear, and the file will be added to the "Uploaded Files" list below.

### Managing Uploaded Files
1. Navigate to the "File Uploads" page from the sidebar.
2. The list shows all files uploaded.
3. Click the document icon (<DescriptionIcon />) next to a file name to open the file in a new tab.
4. Click the delete icon (<DeleteIcon />) next to a file to permanently remove it. You will be asked for confirmation.

## Form Validation Guide

USC-PIS features comprehensive form validation to ensure data accuracy and provide clear guidance when filling out forms. Understanding these validation rules will help you complete forms successfully.

### General Validation Rules

#### **Required Fields**
- Fields marked with an asterisk (*) are required
- You cannot submit a form with empty required fields
- Error message: "[Field name] is required"

#### **Email Validation**
- Must be a valid email format (example@domain.com)
- USC emails should follow the @usc.edu.ph pattern
- Error messages:
  - "Email address is required"
  - "Please enter a valid email address"

#### **Password Requirements**
- **Login**: Any valid password
- **Registration/Password Change**: Strong password required
  - Minimum 8 characters
  - Must contain at least one uppercase letter
  - Must contain at least one lowercase letter  
  - Must contain at least one number
  - Must contain at least one special character (@$!%*?&)
- **Password Confirmation**: Must match the original password
- Error messages:
  - "Password is required"
  - "Password must be at least 8 characters long"
  - "Password must contain at least one uppercase letter, lowercase letter, number, and special character"
  - "Passwords do not match"

### Form-Specific Validation

#### **Medical Records Form**
- **Patient Selection**: Required for medical staff
- **Visit Date**: Required, must be a valid date
- **Diagnosis**: Required, cannot be empty after trimming whitespace
- **Vital Signs** (all optional but validated when provided):
  - Temperature: Must be a positive number
  - Pulse Rate: Must be a positive whole number
  - Respiratory Rate: Must be a positive whole number
  - Height/Weight/BMI: Must be positive numbers
- **Physical Examination**: All fields optional

#### **Medical Certificate Form** (Enhanced August 2025)
- **Patient Search & Selection**: Use the new smart search interface
  - Type patient name, email, USC ID, or ID number
  - Select from real-time filtered results with professional patient cards
  - Confirm selection in the green confirmation panel
- **Template**: Required selection from available certificate templates
- **Diagnosis**: Required, cannot be empty
- **Recommendations**: Required, cannot be empty
- **Valid From Date**: Required, use the date picker
- **Valid Until Date**: Required, must be after the "Valid From" date
- **Additional Notes**: Optional
- **Doctor-Only Fields** (when creating as a doctor):
  - **Medical Fitness Status**: Choose "Fit" or "Not Fit"
  - **Approval Status**: Set to "Approved" or "Rejected"
  - **Fitness Reason**: Required detailed explanation when selecting "Not Fit"

#### **Feedback Form**
- **Rating**: Required, must select 1-5 stars
- **Staff Courtesy**: Required, must select Yes or No
- **Service Recommendation**: Required, must select Yes or No
- **Comments**: Optional
- **Improvement Suggestions**: Optional

#### **Consultation Form**
- **Patient**: Required selection
- **Date and Time**: Required
- **Chief Complaints**: Required, cannot be empty
- **Treatment Plan**: Required, cannot be empty
- **Remarks**: Optional

#### **Health Information Form**
- **Title**: Required, cannot be empty
- **Category**: Required, cannot be empty
- **Content**: Required, cannot be empty

### Understanding Validation Messages

#### **Real-Time Validation**
- Validation occurs as you type or change field values
- Error messages appear immediately below the field
- Fields with errors are highlighted in red
- Valid fields show normal styling

#### **Common Error Messages**
- **"[Field] is required"**: You must fill in this field
- **"Please enter a valid email address"**: Email format is incorrect
- **"[Field] must be a positive number"**: Enter a number greater than 0
- **"[Field] cannot be empty"**: Field appears filled but contains only spaces
- **"Passwords do not match"**: Password confirmation doesn't match original
- **"Please select an option"**: You must choose from the dropdown/radio options

#### **Date Validation Messages (Updated August 3, 2025)**
- **"[Date field] is required"**: You must select a date
- **"[End date] must be after [start date]"**: End date cannot be before start date
- **"Date cannot be in the future"**: For medical records, dental records, and past visits
- **"Date of birth cannot be in the future"**: Birthday validation for profile setup
- **"Must be at least 10 years old"**: Minimum age requirement for birthdate validation
- **"Please enter a valid date of birth"**: Age must be within reasonable limits (10-120 years)
- **"Cannot be more than 1 year in the future"**: For consultation appointments and certificate validity

### Tips for Successful Form Completion

#### **Before Submitting**
1. Check that all required fields (*) are completed
2. Review any error messages and fix them
3. Ensure dates are logical (end dates after start dates)
4. Verify email addresses are correct
5. Double-check numeric values for medical measurements

#### **If You See Validation Errors**
1. Read the error message carefully
2. Focus on the highlighted field
3. Follow the specific guidance provided
4. Re-enter the information correctly
5. The error will disappear when the field is valid

#### **Password Creation Tips**
- Use a combination of words and numbers
- Include special characters like @, !, or *
- Avoid common passwords or personal information
- Example of a strong password: "MyClinic2024!"

### Accessibility Features

- **Screen Reader Support**: All error messages are properly announced
- **Keyboard Navigation**: Tab through form fields in logical order
- **High Contrast**: Error states are clearly visible
- **Clear Labels**: Every field has descriptive labels

This validation system ensures data quality while providing clear guidance to help you complete forms successfully on your first attempt.

## Best Practices

### Security
- Never share your login credentials
- Log out when finished
- Use a strong password
- Update your password regularly
- Report suspicious activity

### Data Entry
- Double-check all information
- Use standardized formats
- Complete all required fields
- Save changes frequently
- Report any errors immediately

### System Usage
- Keep your profile updated
- Check notifications regularly
- Schedule appointments in advance
- Cancel appointments if needed
- Keep contact information current

## Troubleshooting

### Common Issues

#### Cannot Log In
- Verify your email address
- Check caps lock
- Reset password if needed
- Contact support if issues persist

#### Slow Performance
- Check internet connection
- Clear browser cache
- Try a different browser
- Report if issue continues

#### Missing Data
- Refresh the page
- Check filters
- Clear browser cache
- Contact support if data still missing

### Error Messages
- Note the error code
- Take a screenshot
- Document steps to reproduce
- Report to support team

## Support

### Contact Information
- Email: support@usc-pis.com
- Phone: (123) 456-7890
- Hours: Monday-Friday, 8:00 AM - 5:00 PM

### Reporting Issues
1. Document the problem
2. Include error messages
3. List steps to reproduce
4. Provide screenshots if possible
5. Submit via email or support portal

### Feature Requests
- Submit via email
- Include use case
- Describe expected benefits
- Provide examples if possible

### Training Resources
- Video tutorials
- Quick start guides
- FAQ section
- Monthly webinars
- In-person training sessions

---

For additional assistance, please contact the USC-PIS support team or consult with your system administrator. 