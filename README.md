# USC Patient Information System (USC-PIS) (July 15, 2025)

A comprehensive clinic management system for the University of Southern California designed as an undergraduate thesis project.

## Recent Updates (2024)
- ✅ Fixed health-info API routing issues
- ✅ Implemented comprehensive report generation system  
- ✅ Added campaign management with image uploads
- ✅ Enhanced dashboard with role-based statistics

## Features

### Patient Management
- Patient registration and profile management
- Medical and dental records management
- Role-based access control (Admin, Staff, Doctor, Nurse, Student)

### Health Information System
- Health information dissemination
- Campaign management with visual content
- Feedback collection and analytics

### Reporting System
- Patient summary reports
- Visit trends analysis
- Treatment outcomes tracking
- Feedback analysis
- Multiple export formats (PDF, Excel, CSV, JSON)

### System Monitoring
- Database health monitoring
- User activity tracking
- System performance metrics

## Technology Stack
- **Backend**: Django REST Framework
- **Frontend**: React with Material-UI
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **Deployment**: Heroku
- **Authentication**: Token-based authentication

## Installation and Setup

### Local Development
1. Clone the repository
2. Set up virtual environment
3. Install dependencies: `pip install -r requirements.txt`
4. Run migrations: `python manage.py migrate`
5. Create superuser: `python manage.py createsuperuser`
6. Start Django server: `python manage.py runserver`
7. Start React dev server: `npm run dev`

### Production Deployment
- Deployed on Heroku with automatic builds
- PostgreSQL database
- Static files served via WhiteNoise

## API Endpoints

### Authentication
- `/api/auth/login/` - User login
- `/api/auth/register/` - User registration
- `/api/auth/profile/me/` - User profile

### Patients
- `/api/patients/patients/` - Patient management
- `/api/patients/medical-records/` - Medical records
- `/api/patients/dental-records/` - Dental records
- `/api/patients/dashboard-stats/` - Dashboard statistics

### Health Information
- `/api/health-info/health-information/` - Health information management
- `/api/health-info/campaigns/` - Campaign management

### Reports
- `/api/reports/templates/` - Report templates
- `/api/reports/generated/` - Generated reports

## User Roles
- **Admin**: Full system access
- **Staff**: Administrative functions
- **Doctor/Nurse**: Medical record management
- **Student**: Limited access to own records

## License
This project is developed as part of an undergraduate thesis at USC.