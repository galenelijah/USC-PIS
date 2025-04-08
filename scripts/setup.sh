#!/bin/bash

# Exit on error
set -e

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install development dependencies
pip install -r requirements/dev.txt

# Set up environment variables
if [ ! -f .env ]; then
    cp config/settings/.env.example .env
fi

# Set up the database
cd src/backend
python manage.py migrate
python manage.py create_testusers

# Install frontend dependencies
cd ../frontend
npm install

echo "Setup complete! You can now run:"
echo "1. Backend: python manage.py runserver"
echo "2. Frontend: npm run dev" 