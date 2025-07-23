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

    class Meta:
        # Ensure only one feedback per patient per medical record
        # This handles both specific medical record feedback and general feedback
        constraints = [
            models.UniqueConstraint(
                fields=['patient', 'medical_record'],
                name='unique_feedback_per_visit',
                condition=models.Q(medical_record__isnull=False)
            ),
            models.UniqueConstraint(
                fields=['patient'],
                name='unique_general_feedback',
                condition=models.Q(medical_record__isnull=True)
            )
        ]
        indexes = [
            models.Index(fields=['patient', 'medical_record']),
            models.Index(fields=['patient', 'created_at']),
        ]

    def __str__(self):
        if self.medical_record:
            return f"Feedback by {self.patient} for visit {self.medical_record.id} (Rating: {self.rating})"
        return f"General feedback by {self.patient} (Rating: {self.rating})"
