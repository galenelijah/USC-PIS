import React from 'react';
import { Box, Typography, Divider, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import dayjs from 'dayjs';

/**
 * Professional Clinical Report Template for PDF Generation
 * Enhanced for USC Thesis Panel Requirements: Institutional Branding + Analytical Summary
 */
const ReportTemplate = ({ data, patient, title, reportType = 'MEDICAL' }) => {
  if (!data || !Array.isArray(data)) return null;

  // Calculate Analytical Metrics for the report header
  const totalVisits = data.length;
  const uniquePatients = new Set(data.map(r => r.patient)).size;
  const latestVisit = data.length > 0 ? dayjs(data[0].visit_date).format('MMM DD, YYYY') : 'N/A';
  
  // Categorize for summary (if available in data)
  const studentVisits = data.filter(r => (r.patient_role || '').toUpperCase() === 'STUDENT').length;
  const facultyVisits = totalVisits - studentVisits;

  return (
    <Box 
      id="professional-report-template"
      sx={{ 
        width: '210mm', // A4 Width
        minHeight: '297mm', // A4 Height
        padding: '15mm',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: "'Times New Roman', serif", // More formal for academic/clinical reports
        position: 'absolute',
        left: '-9999px', // Hide from view
        top: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* Institutional Branding Header */}
      <Box sx={{ textAlign: 'center', mb: 3, borderBottom: '2px double #003366', pb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#003366', mb: 0.5 }}>
          UNIVERSITY OF SAN CARLOS
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 0.5 }}>
          Health Services Department | University Clinic
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', color: '#7f8c8d' }}>
          Nasipit, Talamban, Cebu City, 6000 | Tel: (032) 230-0100 local 208
        </Typography>
      </Box>

      {/* Report Title & Meta Info */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#c0392b', textTransform: 'uppercase' }}>
            {title || 'CLINICAL SUMMARY REPORT'}
          </Typography>
          <Typography variant="caption">
            REPORT ID: {reportType}-{dayjs().format('YYYYMMDD')}-{Math.floor(Math.random() * 1000)}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2"><strong>Date Generated:</strong> {dayjs().format('MMMM DD, YYYY')}</Typography>
          <Typography variant="body2"><strong>Confidentiality:</strong> Level 3 (Restricted)</Typography>
        </Box>
      </Box>

      {/* Analytical Summary Grid (Metric Cards) */}
      <Grid container spacing={1} sx={{ mb: 4 }}>
        <Grid item xs={3}>
          <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8f9fa' }}>
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>TOTAL RECORDS</Typography>
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>{totalVisits}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8f9fa' }}>
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>PATIENTS</Typography>
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>{uniquePatients || 'Multiple'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8f9fa' }}>
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>STUDENT %</Typography>
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              {totalVisits > 0 ? Math.round((studentVisits / totalVisits) * 100) : '0'}%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8f9fa' }}>
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>LATEST VISIT</Typography>
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', fontSize: '1rem' }}>{latestVisit}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Patient Profile (If single patient) */}
      {patient && (
        <Box sx={{ mb: 4, border: '1px solid #003366', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ bgcolor: '#003366', color: 'white', px: 2, py: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>PATIENT DEMOGRAPHIC PROFILE</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">NAME</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{patient.first_name} {patient.last_name}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">USC ID / STUDENT NO.</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{patient.usc_id || patient.id_number || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">GENDER / AGE</Typography>
                <Typography variant="body2">{patient.gender === 'M' ? 'Male' : 'Female'} ({dayjs().diff(patient.date_of_birth, 'years')} yrs)</Typography>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      {/* Main Clinical Data Table */}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, borderLeft: '4px solid #c0392b', pl: 1 }}>
        VISIT LOGS & CLINICAL FINDINGS
      </Typography>
      
      <TableContainer component={Box} sx={{ border: '1px solid #ddd' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f2f2f2' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>DATE</TableCell>
              {reportType === 'DENTAL' ? (
                <>
                  <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>PROCEDURE (TEETH)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '50%' }}>FINDINGS / REFERRAL</TableCell>
                </>
              ) : (
                <>
                  <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>DIAGNOSIS (VITALS)</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '50%' }}>TREATMENT / PLAN</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.slice(0, 15).map((record, index) => ( // Show first 15 for the summary view
              <TableRow key={index} sx={{ '&:nth-of-type(even)': { bgcolor: '#fafafa' } }}>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {dayjs(record.visit_date).format('MMM DD, YYYY')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dayjs(record.visit_date).format('hh:mm A')}
                  </Typography>
                </TableCell>
                
                <TableCell sx={{ verticalAlign: 'top' }}>
                  {reportType === 'DENTAL' ? (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{record.procedure_performed_display || record.procedure_performed || 'N/A'}</Typography>
                      {record.tooth_numbers && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                          Teeth: {record.tooth_numbers}
                        </Typography>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{record.diagnosis || 'N/A'}</Typography>
                      {(record.vital_signs || record.blood_pressure) && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#666' }}>
                          BP: {record.vital_signs?.blood_pressure || record.blood_pressure || '-'} | 
                          T: {record.vital_signs?.temperature || record.temperature || '-'}°C
                        </Typography>
                      )}
                    </>
                  )}
                </TableCell>

                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Typography variant="body2">
                    {reportType === 'DENTAL' 
                      ? (record.referral_to || 'No referral recorded')
                      : (record.treatment || record.treatment_performed || 'No treatment recorded')
                    }
                  </Typography>
                  {record.medications && (
                    <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                      Rx: {record.medications}
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {data.length > 15 && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', fontStyle: 'italic' }}>
          Showing first 15 records. Please refer to full digital history for complete logs.
        </Typography>
      )}

      {/* Signature & Validation */}
      <Box sx={{ mt: 'auto', pt: 6, display: 'flex', justifyContent: 'flex-end' }}>
        <Box sx={{ width: '60mm', textAlign: 'center' }}>
          <Divider sx={{ mb: 1, borderBottomWidth: 2 }} />
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>AUTHORIZED CLINIC STAFF</Typography>
          <Typography variant="caption" color="text.secondary">Digitally Signed & Verified</Typography>
        </Box>
      </Box>

      {/* Page Footer */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: '10mm', 
        left: '15mm', 
        right: '15mm', 
        borderTop: '1px solid #ddd', 
        pt: 1, 
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <Typography variant="caption" color="text.secondary">
          CONFIDENTIAL PATIENT INFORMATION - FOR OFFICIAL USE ONLY
        </Typography>
        <Typography variant="caption" color="text.secondary">
          USC-PIS v2.0 | Form ACA-HSD-04F
        </Typography>
      </Box>
    </Box>
  );
};

export default ReportTemplate;
