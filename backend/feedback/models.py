from django.db import models
from patients.models import Patient, MedicalRecord

class Feedback(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='feedbacks')
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='feedbacks')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comments = models.TextField(blank=True)
    courteous = models.CharField(max_length=10, blank=True)  # 'yes' or 'no'
    recommend = models.CharField(max_length=10, blank=True)  # 'yes' or 'no'
    improvement = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Feedback by {self.patient} (Rating: {self.rating})"
