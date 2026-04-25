from django.db import models
from patients.models import Patient, MedicalRecord, DentalRecord

class Feedback(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='feedbacks')
    medical_record = models.ForeignKey(MedicalRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='feedbacks')
    dental_record = models.ForeignKey(DentalRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='feedbacks')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comments = models.TextField(blank=True)
    courteous = models.CharField(max_length=10, blank=True)  # 'yes' or 'no'
    recommend = models.CharField(max_length=10, blank=True)  # 'yes' or 'no'
    improvement = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Ensure only one feedback per patient per medical/dental record
        constraints = [
            models.UniqueConstraint(
                fields=['patient', 'medical_record'],
                name='unique_feedback_per_medical_visit',
                condition=models.Q(medical_record__isnull=False)
            ),
            models.UniqueConstraint(
                fields=['patient', 'dental_record'],
                name='unique_feedback_per_dental_visit',
                condition=models.Q(dental_record__isnull=False)
            ),
            models.UniqueConstraint(
                fields=['patient'],
                name='unique_general_feedback',
                condition=models.Q(medical_record__isnull=True, dental_record__isnull=True)
            )
        ]
        indexes = [
            models.Index(fields=['patient', 'medical_record']),
            models.Index(fields=['patient', 'dental_record']),
            models.Index(fields=['patient', 'created_at']),
        ]

    def __str__(self):
        if self.medical_record:
            return f"Feedback by {self.patient} for medical visit {self.medical_record.id} (Rating: {self.rating})"
        if self.dental_record:
            return f"Feedback by {self.patient} for dental visit {self.dental_record.id} (Rating: {self.rating})"
        return f"General feedback by {self.patient} (Rating: {self.rating})"
