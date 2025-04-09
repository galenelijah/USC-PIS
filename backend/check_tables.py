#!/usr/bin/env python
import os
import sys
import django
import dj_database_url
from tabulate import tabulate

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection
from django.apps import apps

def check_tables():
    """Check database tables and their contents."""
    try:
        # Get all models
        models = apps.get_models()
        
        print("Database Tables and Contents:")
        print("=" * 80)
        
        for model in models:
            # Skip Django's internal models
            if model._meta.app_label in ['contenttypes', 'sessions', 'admin', 'auth']:
                continue
                
            # Get model name and app label
            model_name = model._meta.model_name
            app_label = model._meta.app_label
            
            # Get table name
            table_name = model._meta.db_table
            
            # Get field names
            field_names = [field.name for field in model._meta.fields]
            
            # Get record count
            count = model.objects.count()
            
            print(f"\nTable: {table_name} ({app_label}.{model_name})")
            print(f"Fields: {', '.join(field_names)}")
            print(f"Record count: {count}")
            
            # Get sample records (up to 5)
            if count > 0:
                sample_records = model.objects.all()[:5]
                
                # Convert to list of dictionaries
                records = []
                for record in sample_records:
                    record_dict = {}
                    for field in field_names:
                        value = getattr(record, field)
                        # Truncate long values
                        if isinstance(value, str) and len(value) > 30:
                            value = value[:30] + "..."
                        record_dict[field] = value
                    records.append(record_dict)
                
                # Display sample records
                if records:
                    print("\nSample records:")
                    print(tabulate(records, headers="keys", tablefmt="grid"))
            
            print("-" * 80)
        
        print("\nTable check completed successfully!")
        return True
            
    except Exception as e:
        print(f"Error checking tables: {e}")
        return False

if __name__ == "__main__":
    check_tables() 