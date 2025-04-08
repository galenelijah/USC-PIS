# USC-PIS Setup Guide

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
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -r requirements/dev.txt
```

### 3. Configure Environment Variables

```bash
# Copy example environment file
cp config/settings/.env.example .env

# Edit .env file with your settings
nano .env
```

### 4. Set Up Database

```bash
# Apply migrations
cd src/backend
python manage.py migrate

# Create test users
python manage.py create_testusers
```

### 5. Set Up Frontend

```bash
# Install dependencies
cd src/frontend
npm install

# Start development server
npm run dev
```

### 6. Run Development Servers

In separate terminals:

```bash
# Backend (from src/backend)
python manage.py runserver

# Frontend (from src/frontend)
npm run dev
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