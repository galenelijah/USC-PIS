# USC-PIS User Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles](#user-roles)
4. [Main Features](#main-features)
5. [Common Tasks](#common-tasks)
6. [Form Validation Guide](#form-validation-guide)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Support](#support)

## Introduction

Welcome to the USC Patient Information System (USC-PIS). This comprehensive guide will help you navigate and effectively use the system. USC-PIS is designed to streamline patient information management, medical record keeping, and appointment scheduling within the university clinic.

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection
- Screen resolution of 1280x720 or higher

### Accessing the System
1. Visit https://usc-pis-5f030223f7a8.herokuapp.com/
2. Click "Login" in the top right corner
3. Enter your email and password
4. Select "Remember me" if desired
5. Click "Sign In"

### First-Time Setup
1. Upon first login, you'll be prompted to complete your profile using a multi-step form.
2. Fill in all required information marked with an asterisk (*).
3. Patient records are created only after you complete the profile setup, not at registration.
4. Upload a profile photo (optional).
5. Click "Save" to complete setup.
6. After successful setup, you will be redirected to the dashboard.

## User Roles

### Student
- View personal medical records
- Schedule appointments
- Update personal information
- View appointment history
- Access health forms and documents

### Doctor
- View patient records
- Create and update medical records
- Manage appointments
- Issue prescriptions
- Generate medical certificates
- View patient history

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

### Dashboard
- Quick overview of important information
- Recent activities
- Upcoming appointments
- Important notifications
- Quick access to common tasks

### Medical Records
- View complete medical history (medical and dental records combined)
- Add new medical records
- Update existing records
- Attach documents and lab results
- Search and filter records
- **Interface Update**: Medical and dental records are now displayed together in a single "All Records" view for simplified navigation

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

### Viewing Medical Records
1. Navigate to "Medical Records"
2. **All Records Tab**: View both medical and dental records together in a single, unified timeline
3. **Health Insights Tab** (Students only): Access personalized health analytics and recommendations based on your medical history
4. Use the search bar to find specific records by diagnosis, treatment, or complaint
5. Click on a record to expand and view detailed information including vital signs and clinical notes
6. Use the print icon to generate a PDF of your medical history

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

### Viewing Feedback Analytics (Admin/Staff)
1. Click "Feedback" in the navigation sidebar.
2. You will be directed to the **Admin - Patient Feedback** page.
3. At the top, you will see the **Feedback Analytics Summary**:
    - **Total Feedback Entries:** The total number of feedback submissions.
    - **Average Rating:** The average star rating across all feedback.
    - **Rating Distribution Chart:** A bar chart showing the count for each star rating (1-5).
    - **Staff Courteous? / Recommend Service?:** Cards showing the counts for Yes, No, and unanswered responses.
4. Below the analytics, a table displays all individual feedback submissions.

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

#### **Medical Certificate Form**
- **Patient**: Required selection from dropdown
- **Template**: Required selection
- **Diagnosis**: Required, cannot be empty
- **Recommendations**: Required, cannot be empty
- **Valid From Date**: Required
- **Valid Until Date**: Required, must be after the "Valid From" date
- **Additional Notes**: Optional

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

#### **Date Validation Messages**
- **"[Date field] is required"**: You must select a date
- **"[End date] must be after [start date]"**: End date cannot be before start date

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