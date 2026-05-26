from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, SafeEmail, VerificationCode, AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'actor_email', 'action_type', 'target_model', 'target_object_id')
    list_filter = ('action_type', 'target_model', 'timestamp')
    search_fields = ('actor_email', 'target_model', 'target_object_id')
    readonly_fields = ('timestamp', 'actor', 'actor_email', 'actor_role', 'action_type', 'target_model', 'target_object_id', 'changes_summary', 'ip_address', 'user_agent')
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False

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

 