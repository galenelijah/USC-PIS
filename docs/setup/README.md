# USC-PIS Setup Guide (Updated: August 2, 2025)

## Recent Setup Changes
- ✅ **Updated File Structure**: Reflects current project organization
- ✅ **Role-Based Testing**: Enhanced test user creation for different roles
- ✅ **Debug Tools**: Added console logging for troubleshooting student record issues
- ✅ **Data Migration**: Support for nested vital signs JSON structure

## Prerequisites

1. Python 3.12 or higher
2. Node.js 20.x or higher
3. Git
4. PostgreSQL (for production)

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/USC-PIS.git
cd USC-PIS
```

### 2. Set Up Python Environment

```bash
# Navigate to backend directory
cd USC-PIS/backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
# Create .env file in backend directory
touch .env

# Add required environment variables
echo "DEBUG=True" >> .env
echo "SECRET_KEY=your-secret-key-here" >> .env
echo "DATABASE_URL=sqlite:///db.sqlite3" >> .env
```

### 4. Set Up Database

```bash
# Apply migrations (from backend directory)
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Optional: Load sample data
python manage.py loaddata fixtures/sample_data.json
```

### 5. Set Up Frontend

```bash
# Navigate to frontend directory
cd ../backend/frontend/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 6. Run Development Servers

In separate terminals:

```bash
# Backend (from USC-PIS/backend)
source venv/bin/activate  # Windows: venv\Scripts\activate
python manage.py runserver

# Frontend (from USC-PIS/backend/frontend/frontend)
npm run dev
```

## Testing Student Record Functionality

### Create Test Student User
1. Register a new user with role "STUDENT"
2. Create a Patient profile linked to the student user
3. Create medical records for that patient
4. Test student login and verify records appear in `/health-records`

### Debug Student Record Issues
If records don't show for students:
1. Check browser console logs for API responses
2. Verify Patient profile has `user` field set to student User
3. Ensure medical records have correct `patient` field
4. Check vital signs are in proper JSON format:
   ```json
   {
     "vital_signs": {
       "blood_pressure": "120/80",
       "temperature": "36.5",
       "heart_rate": "72"
     }
   }
   ```

## Production Setup

### 1. Set Up Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create usc-pis

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev
```

### 2. Configure Environment Variables

```bash
# Set environment variables
heroku config:set DEBUG=False
heroku config:set SECRET_KEY=your-secret-key
heroku config:set ALLOWED_HOSTS=your-app-name.herokuapp.com
```

### 3. Deploy

```bash
# Deploy to Heroku
./scripts/deploy.sh
```

## Testing

```bash
# Run backend tests
cd src/backend
pytest

# Run frontend tests
cd src/frontend
npm test
```

## Common Issues

### Database Migrations

If you encounter database issues:

```bash
# Reset migrations
python manage.py migrate authentication zero
python manage.py migrate patients zero

# Create fresh migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

### Frontend Build Issues

If you encounter frontend build issues:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

## Security Notes

1. Never commit `.env` files
2. Keep `DEBUG=False` in production
3. Use strong passwords
4. Regularly update dependencies

## Support

For support:
1. Check the documentation
2. Create an issue on GitHub
3. Contact the development team 