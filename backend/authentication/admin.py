from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'course', 'id_number', 'is_staff')
    list_filter = ('role', 'course', 'is_staff', 'is_superuser')
    search_fields = ('email', 'first_name', 'last_name', 'id_number', 'course')
    ordering = ('email',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Profile Info', {'fields': ('role', 'course', 'year_level', 'id_number', 'middle_name')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Profile Info', {'fields': ('role', 'course', 'year_level', 'id_number', 'middle_name')}),
    )

admin.site.register(User, CustomUserAdmin)
 