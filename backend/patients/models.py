from django.db import models
from django.conf import settings
from django.utils import timezone
import datetime

# Create your models here.

class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]

    # Link to the user account, if applicable (especially for students)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,  # Delete patient record if user is deleted
        null=True, 
        blank=True, 
        related_name='patient_profile' # Allows user.patient_profile access
    )
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20)
    address = models.TextField()
    
    # Encrypted fields
    first_name_enc = models.BinaryField(null=True, blank=True, editable=False)
    last_name_enc = models.BinaryField(null=True, blank=True, editable=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def get_full_name(self):
        """Return the full name of the patient"""
        return f"{self.first_name} {self.last_name}"

    @property
    def age(self):
        """Calculate and return the patient's age"""
        from datetime import date
        if not self.date_of_birth:
            return None
        today = date.today()
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))

    class Meta:
        ordering = ['-created_at']

class MedicalRecord(models.Model):
    patient = models.ForeignKey(Patient, related_name='medical_records', on_delete=models.CASCADE)
    visit_date = models.DateTimeField()
    concern = models.TextField(help_text="Reason for visit / Chief complaint", default="")
    diagnosis = models.TextField()
    treatment = models.TextField()
    diagnosis_enc = models.BinaryField(null=True, blank=True, editable=False)
    notes = models.TextField(blank=True)
    vital_signs = models.JSONField(default=dict, blank=True, help_text="Vital signs data (temperature, blood pressure, etc.)")
    physical_examination = models.JSONField(default=dict, blank=True, help_text="Physical examination findings")
    feedback_email_sent = models.BooleanField(default=False, help_text="Track if immediate feedback request email was sent")
    feedback_reminder_sent = models.BooleanField(default=False, help_text="Track if 24-hour feedback reminder email was sent")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-visit_date']

    def save(self, *args, **kwargs):
        # Calculate BMI automatically if height and weight are provided
        if self.vital_signs and isinstance(self.vital_signs, dict):
            try:
                # 1. BMI Calculation
                height = self.vital_signs.get('height')
                weight = self.vital_signs.get('weight')
                if height is not None and weight is not None:
                    h_val = float(height)
                    w_val = float(weight)
                    if h_val > 0 and w_val > 0:
                        # Assume height > 3 is in cm, otherwise meters
                        h_m = h_val if h_val < 3.0 else h_val / 100.0
                        bmi = w_val / (h_m ** 2)
                        self.vital_signs['bmi'] = round(bmi, 2)
                
                # 2. Automated Risk Assessment (Vitals Alerts)
                alerts = []
                
                # Temperature Alert (> 37.5°C is feverish, > 38.0°C is high fever)
                temp = self.vital_signs.get('temperature')
                if temp:
                    t_val = float(temp)
                    if t_val >= 38.0:
                        alerts.append({'type': 'FEVER', 'level': 'CRITICAL', 'message': f"High Fever detected: {t_val}°C"})
                    elif t_val >= 37.5:
                        alerts.append({'type': 'FEVER', 'level': 'WARNING', 'message': f"Low-grade fever: {t_val}°C"})

                # Blood Pressure Alert
                bp = self.vital_signs.get('blood_pressure')
                if bp and '/' in str(bp):
                    try:
                        sys, dia = map(float, str(bp).split('/'))
                        if sys >= 140 or dia >= 90:
                            alerts.append({'type': 'BP', 'level': 'CRITICAL', 'message': f"Hypertension Stage 2: {bp}"})
                        elif sys >= 130 or dia >= 80:
                            alerts.append({'type': 'BP', 'level': 'WARNING', 'message': f"Hypertension Stage 1: {bp}"})
                    except (ValueError, TypeError):
                        pass

                # Heart Rate Alert (Normal 60-100)
                hr = self.vital_signs.get('heart_rate') or self.vital_signs.get('pulse_rate')
                if hr:
                    hr_val = float(hr)
                    if hr_val > 100:
                        alerts.append({'type': 'HR', 'level': 'WARNING', 'message': f"Tachycardia detected: {hr_val} bpm"})
                    elif hr_val < 50: # Slightly lower than 60 to avoid false positives for athletes
                        alerts.append({'type': 'HR', 'level': 'WARNING', 'message': f"Bradycardia detected: {hr_val} bpm"})

                self.vital_signs['alerts'] = alerts
                self.vital_signs['has_alerts'] = len(alerts) > 0
                
            except (TypeError, ValueError):
                pass

        # Ensure visit_date is an aware datetime if it's a plain date
        if self.visit_date and not isinstance(self.visit_date, datetime.datetime) and isinstance(self.visit_date, datetime.date):
            self.visit_date = timezone.make_aware(datetime.datetime.combine(self.visit_date, datetime.time.min))
        # Ensure it's aware if it's a naive datetime
        elif self.visit_date and isinstance(self.visit_date, datetime.datetime) and timezone.is_naive(self.visit_date):
            self.visit_date = timezone.make_aware(self.visit_date)
        super().save(*args, **kwargs)

    def __str__(self):
        # Format visit_date as YYYY-MM-DD for consistency in strings and tests
        if self.visit_date:
            return f"{self.patient} - {self.visit_date.strftime('%Y-%m-%d')}"
        return f"{self.patient} - No Visit Date"

class DentalRecord(models.Model):
    PROCEDURE_CHOICES = [
        ('CONSULTATION', 'Dental Consultation'),
        ('REFERRAL', 'Referral'),
        ('OTHER', 'Other Procedure'),
    ]

    TOOTH_CONDITION_CHOICES = [
        ('HEALTHY', 'Healthy'),
        ('CARIES', 'Caries/Decay'),
        ('MISSING', 'Missing'),
        ('EXTRACTED', 'Extracted'),
        ('OTHER', 'Other'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low Priority'),
        ('MEDIUM', 'Medium Priority'),
        ('HIGH', 'High Priority'),
        ('URGENT', 'Urgent'),
    ]

    patient = models.ForeignKey(Patient, related_name='dental_records', on_delete=models.CASCADE)
    visit_date = models.DateTimeField()
    concern = models.TextField(blank=True, help_text="Student's concern / reason for visit")
    procedure_performed = models.CharField(max_length=20, choices=PROCEDURE_CHOICES, default='CONSULTATION')
    tooth_numbers = models.CharField(max_length=200, blank=True, help_text="Comma-separated tooth numbers (e.g., 11,12,21)")
    diagnosis = models.TextField(blank=True, help_text="Dental diagnosis and findings")
    treatment_performed = models.TextField(blank=True, help_text="Treatment performed during this visit")
    treatment_plan = models.TextField(blank=True, help_text="Future treatment plan")
    referral_to = models.TextField(blank=True, help_text="Referral to other clinic or specialist")
    
    # Detailed dental examination data (now optional)
    oral_hygiene_status = models.CharField(
        max_length=50, 
        choices=[
            ('EXCELLENT', 'Excellent'),
            ('GOOD', 'Good'),
            ('FAIR', 'Fair'),
            ('POOR', 'Poor'),
        ],
        blank=True
    )
    
    gum_condition = models.CharField(
        max_length=50,
        choices=[
            ('HEALTHY', 'Healthy'),
            ('GINGIVITIS', 'Gingivitis'),
            ('PERIODONTITIS', 'Periodontitis'),
            ('INFLAMMATION', 'Inflammation'),
        ],
        blank=True
    )
    
    # Tooth chart data - JSON field to store individual tooth conditions
    tooth_chart = models.JSONField(
        default=dict, 
        blank=True, 
        help_text="Detailed tooth chart with individual tooth conditions"
    )
    
    # Clinical notes and observations
    clinical_notes = models.TextField(blank=True, help_text="Additional clinical observations")
    pain_level = models.IntegerField(null=True, blank=True, help_text="Pain level on scale of 1-10")
    
    # Treatment details
    anesthesia_used = models.BooleanField(default=False)
    anesthesia_type = models.CharField(max_length=100, blank=True)
    materials_used = models.TextField(blank=True, help_text="Materials and medications used")
    
    # Follow-up and recommendations
    next_appointment_recommended = models.DateField(null=True, blank=True)
    home_care_instructions = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='LOW')
    
    # Attachments and documentation
    xray_images = models.JSONField(default=list, blank=True, help_text="List of X-ray image URLs")
    photos = models.JSONField(default=list, blank=True, help_text="List of dental photo URLs")
    documents = models.JSONField(default=list, blank=True, help_text="List of related document URLs")
    
    # Cost and billing information
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    insurance_covered = models.BooleanField(default=False)
    feedback_email_sent = models.BooleanField(default=False, help_text="Track if immediate feedback request email was sent")
    feedback_reminder_sent = models.BooleanField(default=False, help_text="Track if 24-hour feedback reminder email was sent")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-visit_date']

    def save(self, *args, **kwargs):
        # Ensure visit_date is an aware datetime if it's a plain date
        if self.visit_date and not isinstance(self.visit_date, datetime.datetime) and isinstance(self.visit_date, datetime.date):
            self.visit_date = timezone.make_aware(datetime.datetime.combine(self.visit_date, datetime.time.min))
        # Ensure it's aware if it's a naive datetime
        elif self.visit_date and isinstance(self.visit_date, datetime.datetime) and timezone.is_naive(self.visit_date):
            self.visit_date = timezone.make_aware(self.visit_date)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient} - {self.procedure_performed} - {self.visit_date}"

    def get_affected_teeth_display(self):
        """Return a formatted string of affected tooth numbers"""
        if self.tooth_numbers:
            return self.tooth_numbers.replace(',', ', ')
        return "N/A"

class Consultation(models.Model):
    patient = models.ForeignKey(Patient, related_name='consultations', on_delete=models.CASCADE)
    date_time = models.DateTimeField()
    concern = models.TextField(blank=True, help_text="Student's concern / reason for visit")
    chief_complaints = models.TextField(blank=True)  # Kept for backward compatibility
    treatment_plan = models.TextField()
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-date_time']

    def save(self, *args, **kwargs):
        # Sync concern and chief_complaints for backward compatibility
        if self.concern and not self.chief_complaints:
            self.chief_complaints = self.concern
        elif self.chief_complaints and not self.concern:
            self.concern = self.chief_complaints
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient} - {self.date_time}"
