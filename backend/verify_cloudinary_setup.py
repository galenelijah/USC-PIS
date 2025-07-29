#!/usr/bin/env python3
"""
Verification script for Cloudinary setup
Run this to verify the integration is ready but not active
"""

import os
import sys

def check_requirements():
    """Check if cloudinary packages are in requirements.txt"""
    try:
        with open('requirements.txt', 'r') as f:
            content = f.read()
            
        has_active_cloudinary = 'cloudinary==1.36.0' in content and not '# cloudinary==1.36.0' in content
        has_active_storage = 'django-cloudinary-storage==0.3.0' in content and not '# django-cloudinary-storage==0.3.0' in content
        has_commented = '# cloudinary==1.36.0' in content and '# django-cloudinary-storage==0.3.0' in content
        
        print("Requirements Check:")
        if has_active_cloudinary and has_active_storage:
            print("  - cloudinary packages: [OK] Active (ready for production)")
            return True
        elif has_commented:
            print("  - cloudinary packages: [OK] Commented (ready to uncomment)")
            return True
        else:
            print("  - cloudinary packages: [MISSING] Not found")
            return False
    except FileNotFoundError:
        print("[ERROR] requirements.txt not found")
        return False

def check_settings():
    """Check if settings.py has Cloudinary configuration"""
    try:
        with open('backend/settings.py', 'r') as f:
            content = f.read()
            
        has_apps = "'cloudinary_storage'" in content and "'cloudinary'" in content
        has_config = "USE_CLOUDINARY" in content
        has_storage = "DEFAULT_FILE_STORAGE" in content
        
        print("\nSettings Check:")
        print(f"  - Apps in INSTALLED_APPS: {'[OK] Found' if has_apps else '[MISSING]'}")
        print(f"  - Cloudinary configuration: {'[OK] Found' if has_config else '[MISSING]'}")
        print(f"  - Storage backend setup: {'[OK] Found' if has_storage else '[MISSING]'}")
        
        return has_apps and has_config and has_storage
    except FileNotFoundError:
        print("[ERROR] backend/settings.py not found")
        return False

def check_environment():
    """Check environment variables"""
    use_cloudinary = os.environ.get('USE_CLOUDINARY')
    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME')
    api_key = os.environ.get('CLOUDINARY_API_KEY')
    api_secret = os.environ.get('CLOUDINARY_API_SECRET')
    
    print("\nEnvironment Check:")
    print(f"  - USE_CLOUDINARY: {use_cloudinary or 'Not set (correct)'}")
    print(f"  - CLOUDINARY_CLOUD_NAME: {'Set' if cloud_name else 'Not set'}")
    print(f"  - CLOUDINARY_API_KEY: {'Set' if api_key else 'Not set'}")
    print(f"  - CLOUDINARY_API_SECRET: {'Set' if api_secret else 'Not set'}")
    
    # Should be inactive by default
    if use_cloudinary == 'True':
        print("  [WARNING] Cloudinary is currently ACTIVE")
        return False
    else:
        print("  [OK] Cloudinary is INACTIVE (ready for production activation)")
        return True

def check_documentation():
    """Check if documentation exists"""
    setup_guide = os.path.exists('CLOUDINARY_SETUP.md')
    command_exists = os.path.exists('health_info/management/commands/restore_campaign_images.py')
    
    print("\nDocumentation Check:")
    print(f"  - Setup guide: {'[OK] Found' if setup_guide else '[MISSING]'}")
    print(f"  - Management command: {'[OK] Found' if command_exists else '[MISSING]'}")
    
    return setup_guide and command_exists

def main():
    """Main verification function"""
    print("USC-PIS Cloudinary Integration Verification\n")
    
    requirements_ok = check_requirements()
    settings_ok = check_settings()
    environment_ok = check_environment()
    docs_ok = check_documentation()
    
    print("\n" + "="*50)
    
    if all([requirements_ok, settings_ok, environment_ok, docs_ok]):
        print("[SUCCESS] Cloudinary integration is ready!")
        print("\nNext steps:")
        print("1. Create Cloudinary account")
        print("2. Set environment variables in production")
        print("3. Deploy with 'git push heroku main'")
        print("4. Follow CLOUDINARY_SETUP.md for detailed instructions")
        return 0
    else:
        print("[ERROR] ISSUES FOUND: Please fix the missing components")
        return 1

if __name__ == "__main__":
    sys.exit(main())