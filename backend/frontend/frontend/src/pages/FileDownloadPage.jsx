import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  IconButton,
  CircularProgress,
  Alert,
  InputAdornment,
  Chip,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import { fileUploadService } from '../services/api';
import FileViewer from '../components/FileViewer';
import InfoTooltip from '../components/utils/InfoTooltip';

// Get unique file types for filtering
const getUniqueFileTypes = (files) => {
  const types = new Set();
  files.forEach(file => {
    if (file.content_type) {
      // Use primary type (e.g., image from image/jpeg)
      const primaryType = file.content_type.split('/')[0];
      types.add(primaryType);
    }
  });
  return Array.from(types);
};

const FileDownloadPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [fileTypes, setFileTypes] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: 'upload_date',
    direction: 'desc'
  });
  
  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fileUploadService.getAll();
      const fetchedFiles = Array.isArray(response?.data) ? response.data : [];
      setFiles(fetchedFiles);
      
      // Extract unique file types for filter dropdown
      setFileTypes(getUniqueFileTypes(fetchedFiles));
    } catch (err) {
      console.error("Error fetching files:", err);
      setError('Failed to load files. Please try again later.');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handle file download
  const handleDownload = (file) => {
    if (!file || !file.file) return;
    
    const link = document.createElement('a');
    link.href = file.file;
    link.download = file.original_filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open file preview
  const handlePreview = (file) => {
    setCurrentFile(file);
    setViewerOpen(true);
  };

  // Filter and sort files
  const getFilteredAndSortedFiles = () => {
    // First apply search filter
    let filteredFiles = files.filter(file => {
      const searchLower = searchQuery.toLowerCase();
      return (
        file.original_filename?.toLowerCase().includes(searchLower) ||
        file.description?.toLowerCase().includes(searchLower) ||
        file.uploaded_by_email?.toLowerCase().includes(searchLower)
      );
    });
    
    // Apply type filter if not 'all'
    if (filterType !== 'all') {
      filteredFiles = filteredFiles.filter(file => 
        file.content_type && file.content_type.startsWith(filterType)
      );
    }
    
    // Sort the filtered files
    return [...filteredFiles].sort((a, b) => {
      // Handle different data types appropriately
      if (sortConfig.key === 'upload_date') {
        const aDate = new Date(a.upload_date || 0);
        const bDate = new Date(b.upload_date || 0);
        return sortConfig.direction === 'asc' 
          ? aDate - bDate 
          : bDate - aDate;
      }
      
      if (sortConfig.key === 'file_size') {
        const aSize = a.file_size || 0;
        const bSize = b.file_size || 0;
        return sortConfig.direction === 'asc' 
          ? aSize - bSize 
          : bSize - aSize;
      }
      
      // Default string comparison for other fields
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (sortConfig.direction === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type label
  const getFileTypeLabel = (contentType) => {
    if (!contentType) return 'Unknown';
    const [primaryType, subType] = contentType.split('/');
    return primaryType.charAt(0).toUpperCase() + primaryType.slice(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
  };

  const filteredAndSortedFiles = getFilteredAndSortedFiles();

  return (
    <Paper sx={{ p: 3, maxWidth: 1200, mx: 'auto', mt: 4 }} elevation={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5" gutterBottom>File Downloads</Typography>
        <InfoTooltip title="Preview or download uploaded files. Use search and file type filter to narrow results." />
      </Box>
      
      {/* Search and Filter Controls */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1, minWidth: '300px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="file-type-filter-label">File Type</InputLabel>
          <Select
            labelId="file-type-filter-label"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            label="File Type"
            startAdornment={
              <InputAdornment position="start">
                <FilterListIcon />
              </InputAdornment>
            }
          >
            <MenuItem value="all">All Types</MenuItem>
            {fileTypes.map(type => (
              <MenuItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {(searchQuery || filterType !== 'all') && (
          <Button 
            variant="outlined" 
            startIcon={<ClearIcon />}
            onClick={clearFilters}
          >
            Clear Filters
          </Button>
        )}
      </Box>
      
      {/* Error Alert */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Files Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'original_filename'}
                      direction={sortConfig.key === 'original_filename' ? sortConfig.direction : 'asc'}
                      onClick={() => requestSort('original_filename')}
                    >
                      Filename
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'content_type'}
                      direction={sortConfig.key === 'content_type' ? sortConfig.direction : 'asc'}
                      onClick={() => requestSort('content_type')}
                    >
                      Type
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'file_size'}
                      direction={sortConfig.key === 'file_size' ? sortConfig.direction : 'asc'}
                      onClick={() => requestSort('file_size')}
                    >
                      Size
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortConfig.key === 'upload_date'}
                      direction={sortConfig.key === 'upload_date' ? sortConfig.direction : 'asc'}
                      onClick={() => requestSort('upload_date')}
                    >
                      Upload Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Uploaded By</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        {files.length === 0 
                          ? "No files available for download." 
                          : "No files match your search criteria."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedFiles.map((file) => (
                    <TableRow key={file.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: 250 }}>
                          {file.original_filename}
                        </Typography>
                        {file.description && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 250 }}>
                            {file.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getFileTypeLabel(file.content_type)} 
                          size="small" 
                          color={file.content_type?.startsWith('image') ? 'primary' : 
                                 file.content_type?.startsWith('application') ? 'secondary' :
                                 file.content_type?.startsWith('video') ? 'success' : 'default'} 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatFileSize(file.file_size || 0)}</TableCell>
                      <TableCell>{new Date(file.upload_date).toLocaleDateString()}</TableCell>
                      <TableCell>{file.uploaded_by_email || 'Unknown'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Preview File">
                          <IconButton onClick={() => handlePreview(file)} size="small" sx={{ mr: 1 }}>
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download File">
                          <IconButton onClick={() => handleDownload(file)} size="small">
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredAndSortedFiles.length} of {files.length} files
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={fetchFiles}
              startIcon={loading ? <CircularProgress size={20} /> : <FilterListIcon />}
              disabled={loading}
            >
              Refresh Files
            </Button>
          </Box>
        </>
      )}
      
      {/* File Viewer Dialog */}
      <FileViewer 
        file={currentFile}
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </Paper>
  );
};

export default FileDownloadPage; 
