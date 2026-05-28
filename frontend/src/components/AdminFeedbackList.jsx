import React, { useState, useEffect } from 'react';
import { feedbackService } from '../services/api';
import { 
  Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, CircularProgress, Alert, Box, Chip, TablePagination, Tooltip, TextField,
  FormControl, InputLabel, Select, MenuItem, Button, Card, CardContent, Stack, Snackbar
} from '@mui/material';
import FilterListOffIcon from '@mui/icons-material/FilterListOff'; 
import DateRangeIcon from '@mui/icons-material/DateRange';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import InfoTooltip from './utils/InfoTooltip';
import FeedbackAnalytics from './FeedbackAnalytics';
import { reportService } from '../services/reportService';
import ReportTemplate from './utils/ReportTemplate';
import dayjs from 'dayjs';

const AdminFeedbackList = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Custom Filter State Hooks
  const [selectedRating, setSelectedRating] = useState(null); 
  const [commentFilter, setCommentFilter] = useState('all'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [courteousFilter, setCourteousFilter] = useState('all'); 
  const [recommendFilter, setRecommendFilter] = useState('all'); 

  // Get today's local date string formatted as YYYY-MM-DD
  const todayStr = new Date().toLocaleDateString('en-CA'); 

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await feedbackService.getAll();
        setFeedback(response.data);
      } catch (err) {
        console.error("Error fetching feedback:", err);
        setError(err.response?.data?.detail || err.message || 'Failed to load feedback list.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  // --- SEPARATE CLEAR FILTER ACTION HANDLERS ---
  const handleClearTableFilters = () => {
    setSelectedRating(null);
    setCommentFilter('all');
    setCourteousFilter('all');
    setRecommendFilter('all');
    setPage(0);
  };

  const handleClearDateFilters = () => {
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  // Individual State Triggers
  const handleStartDateChange = (e) => { setStartDate(e.target.value); setPage(0); };
  const handleEndDateChange = (e) => { setEndDate(e.target.value); setPage(0); };
  const handleRatingSelect = (rating) => { setSelectedRating(rating); setPage(0); };
  const handleCommentFilterSelect = (e) => { setCommentFilter(e.target.value); setPage(0); };
  const handleCourteousChange = (e) => { setCourteousFilter(e.target.value); setPage(0); };
  const handleRecommendChange = (e) => { setRecommendFilter(e.target.value); setPage(0); };

  // Export Functions
  const handleExportCSV = () => {
    if (filteredFeedback.length === 0) {
      setError('No feedback records to export');
      setTimeout(() => setError(null), 3000);
      return;
    }
    const data = reportService.prepareDataForExport(filteredFeedback, 'FEEDBACK');
    reportService.exportToCSV(data, `patient-feedback-${dayjs().format('YYYY-MM-DD')}.csv`);
    setSuccess(`Exported ${filteredFeedback.length} feedback records to CSV`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleExportExcel = () => {
    if (filteredFeedback.length === 0) {
      setError('No feedback records to export');
      setTimeout(() => setError(null), 3000);
      return;
    }
    const data = reportService.prepareDataForExport(filteredFeedback, 'FEEDBACK');
    reportService.exportToExcel(data, `patient-feedback-${dayjs().format('YYYY-MM-DD')}.xls`);
    setSuccess(`Exported ${filteredFeedback.length} feedback records to Excel`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handlePrintReport = async () => {
    if (filteredFeedback.length === 0) {
      setError('No feedback records to print');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const element = document.getElementById('professional-report-template');
    if (!element) return;

    setLoading(true);
    try {
      await reportService.generatePDF(element, `feedback-analysis-report-${dayjs().format('YYYY-MM-DD')}.pdf`);
      setSuccess('Professional feedback report generated successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      setError('Failed to generate professional PDF report.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Table Pagination Action Handlers
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); 
  };

  const hasText = (field) => {
    if (!field) return false;
    const cleanStr = String(field).trim();
    return cleanStr !== '' && cleanStr !== '-' && cleanStr.toLowerCase() !== 'n/a';
  };

  // --- ISOLATED FILTER TRACKING CHECKS ---
  const isDateFilterActive = startDate !== '' || endDate !== '';
  const isMetadataFilterActive = selectedRating !== null || 
                                 commentFilter !== 'all' || 
                                 courteousFilter !== 'all' || 
                                 recommendFilter !== 'all';

  // --- FILTER LAYER 1: Date Boundaries ---
  const dateFilteredFeedback = feedback.filter(item => {
    if (!item.created_at) return true;
    
    const itemDate = new Date(item.created_at).setHours(0,0,0,0);
    const start = startDate ? new Date(startDate).setHours(0,0,0,0) : null;
    const end = endDate ? new Date(endDate).setHours(23,59,59,999) : null;

    if (start && itemDate < start) return false;
    if (end && itemDate > end) return false;
    return true;
  });

  // --- FILTER LAYER 2: Metadata Modifiers ---
  const filteredFeedback = dateFilteredFeedback.filter(item => {
    const matchesRating = selectedRating === null ? true : Number(item.rating) === Number(selectedRating);
    
    const hasAnyWrittenText = hasText(item.comments) || hasText(item.improvement);
    const matchesComment = commentFilter === 'all' ? true : (commentFilter === 'hasComments' ? hasAnyWrittenText : true);

    const matchesCourteous = courteousFilter === 'all' 
      ? true 
      : String(item.courteous || '').toLowerCase() === courteousFilter.toLowerCase();

    const matchesRecommend = recommendFilter === 'all' 
      ? true 
      : String(item.recommend || '').toLowerCase() === recommendFilter.toLowerCase();

    return matchesRating && matchesComment && matchesCourteous && matchesRecommend;
  });

  // Array slice logic
  const currentFeedback = filteredFeedback.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2, justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h4" component="div" sx={{ mb: 0, mr: 1, fontWeight: 'bold', fontSize: { xs: '1.6rem', sm: '2.125rem' } }}>
            Admin - Patient Feedback Dashboard
          </Typography>
          <InfoTooltip title="Filter analytical charts and records globally using matching layout dropdown selections." />
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportCSV}
            size="small"
            disabled={filteredFeedback.length === 0}
          >
            CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportExcel}
            size="small"
            disabled={filteredFeedback.length === 0}
          >
            Excel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={handlePrintReport}
            size="small"
            disabled={filteredFeedback.length === 0 || loading}
          >
            {loading ? 'Generating...' : 'Print PDF'}
          </Button>
        </Stack>
      </Box>

      {/* Responsive Global Date-Range Filter Panel */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'stretch', sm: 'center' }, bgcolor: 'background.paper' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.secondary', whiteSpace: 'nowrap' }}>
          Global Date Range Filter:
        </Typography>
        <TextField
          label="From Date"
          type="date"
          size="small"
          value={startDate}
          onChange={handleStartDateChange}
          InputLabelProps={{ shrink: true }}
          // Max limits choice to selected "To Date", or if empty, defaults to today
          inputProps={{ max: endDate || todayStr }} 
          fullWidth
        />
        <TextField
          label="To Date"
          type="date"
          size="small"
          value={endDate}
          onChange={handleEndDateChange}
          InputLabelProps={{ shrink: true }}
          // Min prevents selecting a "To Date" earlier than the "From Date"
          inputProps={{ min: startDate, max: todayStr }} 
          fullWidth
        />
        <Button 
          size="small" 
          variant="outlined" 
          color={isDateFilterActive ? "primary" : "inherit"}
          startIcon={<DateRangeIcon />}
          onClick={handleClearDateFilters}
          disabled={!isDateFilterActive}
          sx={{ 
            textTransform: 'none', 
            fontWeight: 'bold',
            py: { xs: 1, sm: 0.5 },
            minWidth: { sm: '120px' },
            "&.Mui-disabled": { borderColor: 'action.disabled' } 
          }}
        >
          Reset Dates
        </Button>
      </Paper>

      {!loading && !error && <FeedbackAnalytics feedbackList={dateFilteredFeedback} />}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          
          {/* RESPONSIVE TABLE CONTROL BAR */}
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
            
            {/* Ratings Chips Row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary', mr: 1 }}>Ratings:</Typography>
              <Chip label="All" size="small" color={selectedRating === null ? 'secondary' : 'default'} clickable onClick={() => handleRatingSelect(null)} />
              {[1, 2, 3, 4, 5].map(rating => (
                <Chip key={rating} label={`${rating} ★`} size="small" color={selectedRating === rating ? 'secondary' : 'default'} clickable onClick={() => handleRatingSelect(selectedRating === rating ? null : rating)} />
              ))}
            </Box>

            {/* Dropdown Filters Container */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
              
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 }, flex: { xs: '1 1 auto', sm: 'initial' } }}>
                <InputLabel id="text-filter-label">Written Content</InputLabel>
                <Select labelId="text-filter-label" value={commentFilter} label="Written Content" onChange={handleCommentFilterSelect}>
                  <MenuItem value="all">All Entries</MenuItem>
                  <MenuItem value="hasComments">With Comments</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 }, flex: { xs: '1 1 auto', sm: 'initial' } }}>
                <InputLabel id="courteous-filter-label">Staff Courteous?</InputLabel>
                <Select labelId="courteous-filter-label" value={courteousFilter} label="Staff Courteous?" onChange={handleCourteousChange}>
                  <MenuItem value="all">All Responses</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 }, flex: { xs: '1 1 auto', sm: 'initial' } }}>
                <InputLabel id="recommend-filter-label">Recommend?</InputLabel>
                <Select labelId="recommend-filter-label" value={recommendFilter} label="Recommend?" onChange={handleRecommendChange}>
                  <MenuItem value="all">All Responses</MenuItem>
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>

              <Button 
                size="small" 
                variant="outlined" 
                color={isMetadataFilterActive ? "error" : "inherit"}
                startIcon={<FilterListOffIcon />}
                onClick={handleClearTableFilters}
                disabled={!isMetadataFilterActive}
                sx={{ 
                  textTransform: 'none', 
                  fontWeight: 'bold',
                  py: { xs: 1, sm: 0.5 },
                  "&.Mui-disabled": { borderColor: 'action.disabled' } 
                }}
              >
                Clear Filters
              </Button>
            </Box>
          </Box>
          
          <Typography sx={{ fontWeight: 'bold', fontSize: 12, px: 2, py: 1, bgcolor: 'action.selected', color: 'text.secondary', borderBottom: '1px solid', borderColor: 'divider' }}>
            Filtered Records: {filteredFeedback.length}
          </Typography>

          {/* VIEWPORT LAYER 1: Large Screen Layout */}
          <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table stickyHeader sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '110px' }}>Date</TableCell>
                  <TableCell align="right" sx={{ width: '90px' }}>Rating</TableCell>
                  <TableCell align="center" sx={{ width: '120px' }}>Courteous?</TableCell>
                  <TableCell align="center" sx={{ width: '120px' }}>Recommend?</TableCell>
                  <TableCell sx={{ width: '35%' }}>Patient Remarks</TableCell>
                  <TableCell sx={{ width: '35%' }}>Suggestions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentFeedback.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No feedback records found for this combination.</TableCell>
                  </TableRow>
                ) : (
                  currentFeedback.map((item) => (
                    <TableRow hover key={item.id}>
                      <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>{item.rating} ★</TableCell>
                      <TableCell align="center">{item.courteous || 'N/A'}</TableCell>
                      <TableCell align="center">{item.recommend || 'N/A'}</TableCell>
                      
                      <TableCell sx={{ wordBreak: 'break-word', verticalAlign: 'top' }}>
                        {hasText(item.comments) ? (
                          <Tooltip title="Hover to view timeline details" arrow placement="top">
                            <Typography variant="body2" sx={{ lineHeight: 1.5, color: 'text.primary' }}>
                              {item.comments}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.disabled">-</Typography>
                        )}
                      </TableCell>

                      <TableCell sx={{ wordBreak: 'break-word', verticalAlign: 'top' }}>
                        {hasText(item.improvement) ? (
                          <Tooltip title="Hover to view timeline details" arrow placement="top">
                            <Typography variant="body2" sx={{ lineHeight: 1.5, color: 'text.primary' }}>
                              {item.improvement}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.disabled">-</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* VIEWPORT LAYER 2: Small Screen Layout */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
            {currentFeedback.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                No feedback records found for this combination.
              </Box>
            ) : (
              currentFeedback.map((item) => (
                <Card key={item.id} variant="outlined" sx={{ mb: 2, borderRadius: 2, borderColor: 'divider' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: '500', flexGrow: 1 }}>
                        Date: {new Date(item.created_at).toLocaleDateString()}
                      </Typography>
                      <Chip label={`${item.rating} ★`} size="small" color="primary" sx={{ fontWeight: 'bold' }} />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip label={`Courteous: ${item.courteous || 'N/A'}`} size="small" variant="outlined" />
                      <Chip label={`Recommend: ${item.recommend || 'N/A'}`} size="small" variant="outlined" />
                    </Box>

                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block' }}>
                        Patient Remarks:
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word', mt: 0.5 }}>
                        {hasText(item.comments) ? item.comments : <span style={{ color: '#bdbdbd' }}>-</span>}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary', display: 'block' }}>
                        Suggestions:
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word', mt: 0.5 }}>
                        {hasText(item.improvement) ? item.improvement : <span style={{ color: '#bdbdbd' }}>-</span>}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
          
          <TablePagination 
            rowsPerPageOptions={[10, 25, 100]} 
            component="div" 
            count={filteredFeedback.length} 
            rowsPerPage={rowsPerPage} 
            page={page} 
            onPageChange={handlePageChange} 
            onRowsPerPageChange={handleRowsPerPageChange}
            sx={{
              '.MuiTablePagination-toolbar': {
                px: { xs: 1, sm: 2 },
                flexWrap: 'wrap',
                justifyContent: 'center'
              },
              '.MuiTablePagination-actions': {
                ml: { xs: 0.5, sm: 2 }
              }
            }}
          />
        </Paper>
      )}

      {/* Professional Report Template (Hidden) */}
      <ReportTemplate 
        data={filteredFeedback} 
        title="PATIENT FEEDBACK ANALYSIS REPORT" 
        reportType="FEEDBACK"
      />

      <Snackbar
        open={!!success || !!error}
        autoHideDuration={4000}
        onClose={() => { setSuccess(null); setError(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => { setSuccess(null); setError(null); }} 
          severity={success ? "success" : "error"} 
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {success || error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminFeedbackList;
