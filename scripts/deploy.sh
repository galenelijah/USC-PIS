#!/bin/bash

# Exit on error
set -e

# Build frontend
cd src/frontend
npm run build

# Collect static files
cd ../backend
python manage.py collectstatic --noinput

# Deploy to Heroku
git add .
git commit -m "Deploy: $(date)"
git push heroku main

echo "Deployment complete! Your app should be live at:"
echo "https://usc-pis.herokuapp.com/" 