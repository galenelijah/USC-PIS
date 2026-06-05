import os
from dotenv import load_dotenv

# Simulate what happens in settings.py
os.environ['DATABASE_URL'] = ''
load_dotenv('backend/.env')
print(f"DATABASE_URL after load_dotenv: '{os.environ.get('DATABASE_URL')}'")

if os.environ.get('DATABASE_URL'):
    print("Logic: Using Postgres")
else:
    print("Logic: Using SQLite")
