import React from 'react';
import { Box, Typography, Divider, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import dayjs from 'dayjs';

/**
 * Professional Clinical Report Template for PDF Generation
 * Enhanced for USC Thesis Panel Requirements: Institutional Branding + Analytical Summary + Diagrams
 */
const ReportTemplate = ({ data, patient, title, reportType = 'MEDICAL' }) => {
  if (!data || !Array.isArray(data)) return null;

  // 1. Calculate Analytical Metrics
  const totalVisits = data.length;
  const uniquePatients = reportType === 'FEEDBACK' ? 'N/A' : new Set(data.map(r => r.patient)).size;
  const latestVisit = data.length > 0 
    ? dayjs(data[0].visit_date || data[0].created_at).format('MMM DD, YYYY') 
    : 'N/A';
  
  // Categorize for summary
  const studentVisits = data.filter(r => (r.patient_role || '').toUpperCase() === 'STUDENT').length;
  const facultyVisits = totalVisits - studentVisits;

  // 2. Data for Diagrams
  const distributionData = {};
  data.forEach(item => {
    let key = 'Other';
    if (reportType === 'DENTAL') {
      key = item.procedure_performed_display || item.procedure_performed || 'Other';
    } else if (reportType === 'MEDICAL') {
      key = item.diagnosis || 'Other';
    } else if (reportType === 'FEEDBACK') {
      key = `${item.rating} Star${item.rating !== 1 ? 's' : ''}`;
    }
    
    // Clean key (truncate long diagnoses for chart)
    const cleanKey = key.length > 25 ? key.substring(0, 25) + '...' : key;
    distributionData[cleanKey] = (distributionData[cleanKey] || 0) + 1;
  });

  const sortedDistribution = reportType === 'FEEDBACK'
    ? Object.entries(distributionData).sort((a, b) => b[0].localeCompare(a[0])) // Sort by stars
    : Object.entries(distributionData).sort((a, b) => b[1] - a[1]).slice(0, 5); // Top 5

  const maxFreq = Math.max(...sortedDistribution.map(d => d[1]), 1);

  return (
    <Box 
      id="professional-report-template"
      sx={{ 
        width: '210mm', // A4 Width
        minHeight: '297mm', // A4 Height
        padding: '15mm',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: "'Times New Roman', serif",
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
          <Typography variant="body2"><strong>Classification:</strong> OFFICIAL RECORD</Typography>
        </Box>
      </Box>

      {/* Analytical Summary Grid (Metric Cards) */}
      <Grid container spacing={1} sx={{ mb: 3 }}>
        <Grid item xs={3}>
          <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8f9fa' }}>
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>
              {reportType === 'FEEDBACK' ? 'TOTAL FEEDBACK' : 'TOTAL RECORDS'}
            </Typography>
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>{totalVisits}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8f9fa' }}>
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>
              {reportType === 'FEEDBACK' ? 'AVG RATING' : 'UNIQUE PATIENTS'}
            </Typography>
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              {reportType === 'FEEDBACK' 
                ? (totalVisits > 0 ? (data.reduce((acc, curr) => acc + curr.rating, 0) / totalVisits).toFixed(1) : '0')
                : (uniquePatients || 'Multiple')
              }
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8f9fa' }}>
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>STUDENT RATIO</Typography>
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
              {totalVisits > 0 ? Math.round((studentVisits / totalVisits) * 100) : '0'}%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={3}>
          <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f8f9fa' }}>
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 'bold' }}>LATEST ENTRY</Typography>
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold', fontSize: '1rem' }}>{latestVisit}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Analytical Diagrams Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1.5, color: '#003366' }}>
          VISUAL DATA ANALYTICS
        </Typography>
        <Grid container spacing={2}>
          {/* Distribution Bar Chart */}
          <Grid item xs={7}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 2, display: 'block' }}>
                {reportType === 'FEEDBACK' ? 'RATING DISTRIBUTION' : `TOP 5 ${reportType === 'DENTAL' ? 'PROCEDURES' : 'DIAGNOSES'} BY FREQUENCY`}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {sortedDistribution.map(([label, freq], idx) => (
                  <Box key={idx} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{label}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{freq}</Typography>
                    </Box>
                    <Box sx={{ width: '100%', height: 12, bgcolor: '#f0f0f0', borderRadius: 1, overflow: 'hidden' }}>
                      <Box 
                        sx={{ 
                          width: `${(freq / maxFreq) * 100}%`, 
                          height: '100%', 
                          bgcolor: reportType === 'FEEDBACK' ? '#fbc02d' : '#1976d2',
                          transition: 'width 1s ease-in-out'
                        }} 
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Classification Doughnut-like Chart */}
          <Grid item xs={5}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', mb: 2, display: 'block', width: '100%', textAlign: 'left' }}>
                PATIENT CLASSIFICATION
              </Typography>
              <Box sx={{ 
                position: 'relative', 
                width: 100, 
                height: 100, 
                borderRadius: '50%', 
                background: `conic-gradient(#1976d2 0% ${totalVisits > 0 ? Math.round((studentVisits/totalVisits)*100) : 0}%, #e67e22 ${totalVisits > 0 ? Math.round((studentVisits/totalVisits)*100) : 0}% 100%)`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 2,
                mt: 1
              }}>
                <Box sx={{ width: 60, height: 60, bgcolor: 'white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>{totalVisits}</Typography>
                </Box>
              </Box>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ width: 10, height: 10, bgcolor: '#1976d2', mr: 1, borderRadius: '2px' }} />
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>STUDENTS: {studentVisits} ({totalVisits > 0 ? Math.round((studentVisits/totalVisits)*100) : 0}%)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ width: 10, height: 10, bgcolor: '#e67e22', mr: 1, borderRadius: '2px' }} />
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>FACULTY/STAFF: {facultyVisits} ({totalVisits > 0 ? Math.round((facultyVisits/totalVisits)*100) : 0}%)</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Patient Profile (If single patient filter is active) */}
      {patient && reportType !== 'FEEDBACK' && (
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

      {/* Main Data Table */}
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, borderLeft: '4px solid #c0392b', pl: 1 }}>
        {reportType === 'FEEDBACK' ? 'PATIENT FEEDBACK LOGS' : 'VISIT LOGS & CLINICAL FINDINGS'}
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
              ) : reportType === 'FEEDBACK' ? (
                <>
                  <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>RATING</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '35%' }}>COMMENTS</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>IMPROVEMENTS</TableCell>
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
            {data.slice(0, 10).map((record, index) => ( // Reduced to 10 to fit diagrams on page 1
              <TableRow key={index} sx={{ '&:nth-of-type(even)': { bgcolor: '#fafafa' } }}>
                <TableCell sx={{ verticalAlign: 'top' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {dayjs(record.visit_date || record.created_at).format('MMM DD, YYYY')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dayjs(record.visit_date || record.created_at).format('hh:mm A')}
                  </Typography>
                </TableCell>
                
                {reportType === 'FEEDBACK' ? (
                  <>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#fbc02d' }}>
                        {'★'.repeat(record.rating)}{'☆'.repeat(5-record.rating)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Typography variant="body2">{record.comments || 'No comments'}</Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Typography variant="body2">{record.improvement || 'No suggestions'}</Typography>
                    </TableCell>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {data.length > 10 && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', fontStyle: 'italic' }}>
          Showing top 10 records for summary view. Refer to digital logs for exhaustive history.
        </Typography>
      )}

      {/* Signature & Validation */}
      <Box sx={{ mt: 'auto', pt: 4, display: 'flex', justifyContent: 'flex-end' }}>
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
          CONFIDENTIAL PATIENT INFORMATION - USC HEALTH SERVICES
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Form ACA-HSD-04F | USC-PIS v2.0
        </Typography>
      </Box>
    </Box>
  );
};

export default ReportTemplate;
