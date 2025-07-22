from django.db import models
from django.conf import settings

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
        on_delete=models.SET_NULL,  # Keep patient record if user is deleted
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
    visit_date = models.DateField()
    diagnosis = models.TextField()
    treatment = models.TextField()
    notes = models.TextField(blank=True)
    vital_signs = models.JSONField(default=dict, blank=True, help_text="Vital signs data (temperature, blood pressure, etc.)")
    physical_examination = models.JSONField(default=dict, blank=True, help_text="Physical examination findings")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-visit_date']

    def __str__(self):
        return f"{self.patient} - {self.visit_date}"

class DentalRecord(models.Model):
    PROCEDURE_CHOICES = [
        ('CLEANING', 'Dental Cleaning'),
        ('FILLING', 'Dental Filling'),
        ('EXTRACTION', 'Tooth Extraction'),
        ('ROOT_CANAL', 'Root Canal Treatment'),
        ('CROWN', 'Crown Placement'),
        ('BRIDGE', 'Bridge Work'),
        ('IMPLANT', 'Dental Implant'),
        ('ORTHODONTIC', 'Orthodontic Treatment'),
        ('PERIODONTAL', 'Periodontal Treatment'),
        ('PROPHYLAXIS', 'Prophylaxis'),
        ('FLUORIDE', 'Fluoride Treatment'),
        ('SEALANT', 'Dental Sealant'),
        ('WHITENING', 'Teeth Whitening'),
        ('CONSULTATION', 'Dental Consultation'),
        ('XRAY', 'Dental X-Ray'),
        ('OTHER', 'Other Procedure'),
    ]

    TOOTH_CONDITION_CHOICES = [
        ('HEALTHY', 'Healthy'),
        ('CARIES', 'Caries/Decay'),
        ('FILLED', 'Filled'),
        ('CROWN', 'Crown'),
        ('MISSING', 'Missing'),
        ('EXTRACTED', 'Extracted'),
        ('IMPACTED', 'Impacted'),
        ('FRACTURED', 'Fractured'),
        ('SENSITIVE', 'Sensitive'),
        ('ROOT_CANAL', 'Root Canal Treated'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low Priority'),
        ('MEDIUM', 'Medium Priority'),
        ('HIGH', 'High Priority'),
        ('URGENT', 'Urgent'),
    ]

    patient = models.ForeignKey(Patient, related_name='dental_records', on_delete=models.CASCADE)
    visit_date = models.DateField()
    procedure_performed = models.CharField(max_length=20, choices=PROCEDURE_CHOICES)
    tooth_numbers = models.CharField(max_length=200, blank=True, help_text="Comma-separated tooth numbers (e.g., 11,12,21)")
    diagnosis = models.TextField(help_text="Dental diagnosis and findings")
    treatment_performed = models.TextField(help_text="Treatment performed during this visit")
    treatment_plan = models.TextField(blank=True, help_text="Future treatment plan")
    
    # Detailed dental examination data
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
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-visit_date']

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
    chief_complaints = models.TextField()
    treatment_plan = models.TextField()
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    class Meta:
        ordering = ['-date_time']

    def __str__(self):
        return f"{self.patient} - {self.date_time}"
