import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  Button, CircularProgress, Tooltip, Alert, Badge
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  FilePresent as FileIcon
} from '@mui/icons-material';
import { reportService } from '../../services/api';
import dayjs from 'dayjs';

const ReportArchive = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      
      const response = await reportService.getReports({ ordering: '-created_at' });
      setReports(response.data.results || response.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setError("Failed to load report history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    
    // Determine polling frequency: 5s if active work, 30s otherwise
    const hasPending = reports.some(r => r.status === 'PENDING' || r.status === 'GENERATING');
    const intervalTime = hasPending ? 5000 : 30000;
    
    const interval = setInterval(() => {
      fetchReports(true);
    }, intervalTime);
    
    return () => clearInterval(interval);
  }, [fetchReports, reports.length, reports.some(r => r.status === 'PENDING' || r.status === 'GENERATING')]);

  const handleDownload = async (report) => {
    try {
      const response = await reportService.downloadReport(report.id);
      
      // Create a blob from the response data
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use a default
      const extMap = {
        'PDF': 'pdf',
        'EXCEL': 'xlsx',
        'CSV': 'csv',
        'JSON': 'json',
        'HTML': 'html'
      };
      const extension = extMap[report.export_format] || report.export_format.toLowerCase();
      const filename = `${report.title.replace(/\s+/g, '_')}_${dayjs(report.created_at).format('YYYYMMDD')}.${extension}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download report. Please try again.");
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    
    try {
      await reportService.deleteReport(reportId);
      setReports(reports.filter(r => r.id !== reportId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete report.");
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <Chip size="small" icon={<SuccessIcon />} label="Ready" color="success" variant="outlined" />;
      case 'GENERATING':
        return <Chip size="small" icon={<CircularProgress size={16} />} label="Generating..." color="primary" variant="outlined" />;
      case 'PENDING':
        return <Chip size="small" icon={<PendingIcon />} label="Queued" color="warning" variant="outlined" />;
      case 'FAILED':
        return <Chip size="small" icon={<ErrorIcon />} label="Failed" color="error" variant="outlined" />;
      default:
        return <Chip size="small" label={status} />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8faff', borderBottom: '1px solid #edf2f7' }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Badge badgeContent={reports.length} color="primary">
              <FileIcon sx={{ color: '#303f9f', fontSize: 28 }} />
            </Badge>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e' }}>
                Report Archive
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Access your recently generated clinical and administrative exports
              </Typography>
            </Box>
          </Box>
          <Button 
            startIcon={refreshing ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />} 
            onClick={() => fetchReports(true)}
            disabled={refreshing}
            size="small"
            variant="outlined"
            sx={{ borderRadius: '8px' }}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        )}

        <TableContainer component={Box}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Report Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Format</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Generated On</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography color="text.secondary">No reports generated yet.</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Use the "Export" buttons in the workshops above to generate new reports.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {report.title}
                      </Typography>
                      {report.error_message && (
                        <Typography variant="caption" color="error" display="block">
                          {report.error_message}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.export_format} 
                        size="small" 
                        sx={{ 
                          fontWeight: 700, 
                          bgcolor: report.export_format === 'PDF' ? '#fee2e2' : 
                                   report.export_format === 'HTML' ? '#e0f2fe' : 
                                   report.export_format === 'JSON' ? '#fef3c7' : '#dcfce7',
                          color: report.export_format === 'PDF' ? '#ef4444' : 
                                 report.export_format === 'HTML' ? '#0284c7' : 
                                 report.export_format === 'JSON' ? '#d97706' : '#16a34a'
                        }} 
                      />
                    </TableCell>
                    <TableCell>
                      {dayjs(report.created_at).format('MMM DD, YYYY HH:mm')}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(report.status)}
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Tooltip title="Download Report">
                          <span>
                            <IconButton 
                              color="primary" 
                              onClick={() => handleDownload(report)}
                              disabled={report.status !== 'COMPLETED'}
                              size="small"
                            >
                              <DownloadIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            color="error" 
                            onClick={() => handleDelete(report.id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {reports.length > 0 && (
          <Box sx={{ p: 2, textAlign: 'center', bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <Typography variant="caption" color="text.secondary">
              Reports are automatically kept for 30 days before expiring.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportArchive;
