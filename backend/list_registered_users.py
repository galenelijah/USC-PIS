import os
import django
import sys

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authentication.models import User

def list_users():
    users = User.objects.all().order_by('id')
    
    user_data = []
    headers = ["ID", "Email", "Name", "Role", "Verified", "Staff", "Super", "Joined"]
    
    for user in users:
        full_name = f"{user.first_name} {user.last_name}".strip() or "N/A"
        user_data.append([
            str(user.id),
            user.email,
            full_name,
            user.role,
            "Yes" if user.is_verified else "No",
            "Yes" if user.is_staff else "No",
            "Yes" if user.is_superuser else "No",
            user.date_joined.strftime('%Y-%m-%d') if user.date_joined else 'N/A'
        ])
    
    try:
        from tabulate import tabulate
        print(tabulate(user_data, headers=headers, tablefmt="grid"))
    except ImportError:
        # Simple fallback formatting
        print(f"{' | '.join(headers)}")
        print("-" * 100)
        for row in user_data:
            print(" | ".join(row))

if __name__ == "__main__":
    list_users()
