from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SafeEmail, VerificationCode

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'course', 'id_number', 'is_staff', 'is_verified')
    list_filter = ('role', 'course', 'is_staff', 'is_superuser', 'is_verified')
    search_fields = ('email', 'first_name', 'last_name', 'id_number', 'course')
    ordering = ('email',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Profile Info', {'fields': ('role', 'course', 'year_level', 'id_number', 'middle_name', 'is_verified')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Profile Info', {'fields': ('role', 'course', 'year_level', 'id_number', 'middle_name', 'is_verified')}),
    )

@admin.register(SafeEmail)
class SafeEmailAdmin(admin.ModelAdmin):
    list_display = ('email', 'is_active', 'created_at')
    search_fields = ('email',)

@admin.register(VerificationCode)
class VerificationCodeAdmin(admin.ModelAdmin):
    list_display = ('user', 'code', 'created_at', 'expires_at', 'is_used')
    search_fields = ('user__email', 'code')

admin.site.register(User, CustomUserAdmin)

 