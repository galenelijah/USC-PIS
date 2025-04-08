# USC Patient Information System (USC-PIS)

A comprehensive patient information management system for the University of San Carlos Health Services.

## Project Structure

```
USC-PIS/
├── src/                    # Source code
│   ├── backend/           # Django backend
│   │   ├── authentication/  # User authentication
│   │   ├── patients/       # Patient management
│   │   └── api/           # API endpoints
│   └── frontend/          # React frontend
│       ├── public/        # Static files
│       └── src/           # React components
├── docs/                  # Documentation
│   ├── api/              # API documentation
│   ├── setup/            # Setup guides
│   └── user/             # User guides
├── tests/                # Test files
│   ├── backend/         # Backend tests
│   └── frontend/        # Frontend tests
├── config/               # Configuration files
│   ├── nginx/           # Nginx configuration
│   └── settings/        # Environment settings
├── scripts/             # Utility scripts
│   ├── setup.sh        # Setup script
│   └── deploy.sh       # Deployment script
├── requirements/        # Python requirements
│   ├── base.txt       # Base requirements
│   ├── dev.txt        # Development requirements
│   └── prod.txt       # Production requirements
└── manage.py           # Django management script

## Features

- User Authentication (Students, Doctors, Nurses, Staff)
- Patient Records Management
- Medical Records Management
- Appointment Scheduling
- Role-based Access Control
- Responsive Dashboard
- Secure Data Storage

## Technology Stack

- Backend: Django + Django REST Framework
- Frontend: React + Material-UI
- Database: PostgreSQL (Production) / SQLite (Development)
- Authentication: Token-based Authentication
- Deployment: Heroku

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/USC-PIS.git
   cd USC-PIS
   ```

2. Set up the backend:
   ```bash
   cd src/backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements/dev.txt
   python manage.py migrate
   python manage.py create_testusers  # Creates test users
   python manage.py runserver
   ```

3. Set up the frontend:
   ```bash
   cd src/frontend
   npm install
   npm run dev
   ```

4. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api/

## Test Users

1. Doctor:
   - Email: doctor@test.com
   - Password: testpass123

2. Nurse:
   - Email: nurse@test.com
   - Password: testpass123

## Development

1. Follow the coding standards in `docs/development/standards.md`
2. Write tests for new features
3. Update documentation as needed

## Deployment

1. Set up environment variables (see `config/settings/.env.example`)
2. Run deployment script: `./scripts/deploy.sh`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact the development team or create an issue in the repository.