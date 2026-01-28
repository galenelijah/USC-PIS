from django.contrib import admin
from .models import Patient, MedicalRecord, DentalRecord

class PatientAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'email', 'get_course', 'gender', 'age', 'created_at')
    search_fields = ('first_name', 'last_name', 'email', 'user__course')
    list_filter = ('gender', 'user__course')

    def get_course(self, obj):
        if obj.user and obj.user.course:
            return obj.user.course
        return "N/A"
    get_course.short_description = 'Course'
    get_course.admin_order_field = 'user__course'

# Register your models here.
admin.site.register(Patient, PatientAdmin)
admin.site.register(MedicalRecord)
admin.site.register(DentalRecord)
