import React from 'react';
import { Box, Typography, Divider, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import dayjs from 'dayjs';

/**
 * Professional Clinical Report Template for PDF Generation
 */
const ReportTemplate = ({ data, patient, title, reportType = 'MEDICAL' }) => {
  if (!data || !Array.isArray(data)) return null;

  return (
    <Box 
      id="professional-report-template"
      sx={{ 
        width: '210mm', // A4 Width
        minHeight: '297mm', // A4 Height
        padding: '20mm',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        position: 'absolute',
        left: '-9999px', // Hide from view
        top: 0
      }}
    >
      {/* Institutional Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, borderBottom: '2px solid #1976d2', pb: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', letterSpacing: 1 }}>
            UNIVERSITY OF SAN CARLOS
          </Typography>
          <Typography variant="h6" sx={{ color: '#555' }}>
            Health Services Department | University Clinic
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Nasipit, Talamban, Cebu City, 6000 | (032) 230-0100
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {title || 'CLINICAL SUMMARY REPORT'}
          </Typography>
          <Typography variant="body2">
            Generated: {dayjs().format('MMMM DD, YYYY [at] HH:mm')}
          </Typography>
        </Box>
      </Box>

      {/* Patient Demographic Section */}
      {patient && (
        <Box sx={{ mb: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, borderBottom: '1px solid #ddd' }}>
            PATIENT INFORMATION
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2"><strong>Name:</strong> {patient.first_name} {patient.last_name}</Typography>
              <Typography variant="body2"><strong>ID Number:</strong> {patient.usc_id || patient.id_number || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2"><strong>Date of Birth:</strong> {patient.date_of_birth ? dayjs(patient.date_of_birth).format('MMM DD, YYYY') : 'N/A'}</Typography>
              <Typography variant="body2"><strong>Gender:</strong> {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'N/A'}</Typography>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Clinical Records Section */}
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
        VISIT HISTORY & CLINICAL FINDINGS
      </Typography>

      {data.map((record, index) => (
        <Box key={index} sx={{ mb: 4, pageBreakInside: 'avoid' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#e3f2fd', p: 1, borderRadius: '4px 4px 0 0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              VISIT DATE: {dayjs(record.visit_date).format('MMMM DD, YYYY')}
            </Typography>
            <Typography variant="subtitle2">
              Record Type: {record.record_type || reportType}
            </Typography>
          </Box>
          
          <Box sx={{ border: '1px solid #e3f2fd', p: 2, borderRadius: '0 0 4px 4px' }}>
            <Grid container spacing={2}>
              {/* Vital Signs (if medical) */}
              {(record.vital_signs || record.blood_pressure) && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>
                    Vital Signs
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, mt: 0.5, mb: 2, flexWrap: 'wrap' }}>
                    <Typography variant="body2">BP: {record.vital_signs?.blood_pressure || record.blood_pressure || 'N/A'}</Typography>
                    <Typography variant="body2">Temp: {record.vital_signs?.temperature || record.temperature || 'N/A'}°C</Typography>
                    <Typography variant="body2">HR: {record.vital_signs?.heart_rate || record.pulse_rate || 'N/A'} bpm</Typography>
                    <Typography variant="body2">RR: {record.vital_signs?.respiratory_rate || record.respiratory_rate || 'N/A'}/min</Typography>
                  </Box>
                </Grid>
              )}

              {/* Dental Specifics */}
              {record.record_type === 'DENTAL' && (
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>Procedure</Typography>
                      <Typography variant="body2">{record.procedure_performed_display || record.procedure_performed || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>Tooth Number(s)</Typography>
                      <Typography variant="body2">{record.tooth_numbers || 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                </Grid>
              )}

              {/* Assessment */}
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>Chief Complaint / Concern</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>{record.chief_complaint || record.concern || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>Diagnosis</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{record.diagnosis || 'No diagnosis recorded'}</Typography>
              </Grid>

              {/* Plan */}
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>Treatment Plan / Procedure Performed</Typography>
                <Typography variant="body2">{record.treatment || record.treatment_performed || 'N/A'}</Typography>
              </Grid>

              {record.medications && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>Medications Prescribed</Typography>
                  <Typography variant="body2">{record.medications}</Typography>
                </Grid>
              )}

              {(record.notes || record.clinical_notes) && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: '#666' }}>Clinical Notes</Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{record.notes || record.clinical_notes}</Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      ))}

      {/* Branded Footer */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: '20mm', 
        left: '20mm', 
        right: '20mm', 
        borderTop: '1px solid #ddd', 
        pt: 2, 
        textAlign: 'center' 
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          CONFIDENTIAL MEDICAL RECORD - UNIVERSITY OF SAN CARLOS CLINIC
        </Typography>
        <Typography variant="caption" color="text.secondary">
          This document is generated for official use. Any unauthorized reproduction is strictly prohibited.
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
          Page 1 of 1
        </Typography>
      </Box>
    </Box>
  );
};

export default ReportTemplate;
