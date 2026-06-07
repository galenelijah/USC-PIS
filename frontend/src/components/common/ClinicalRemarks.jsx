import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Avatar, 
  Stack, 
  Divider, 
  Chip,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Send as SendIcon, 
  Notes as NotesIcon,
  Person as PersonIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { clinicalRemarkService } from '../../services/api';
import { useSelector } from 'react-redux';

const ClinicalRemarks = ({ 
  remarks = [], 
  contentTypeId, 
  objectId, 
  onRemarkAdded,
  readOnly = false 
}) => {
  const [newRemark, setNewRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const user = useSelector(state => state.auth.user);
  const isMedicalStaff = user?.role && ['ADMIN', 'DOCTOR', 'NURSE', 'DENTIST'].includes(user.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newRemark.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await clinicalRemarkService.create({
        content_type: contentTypeId,
        object_id: objectId,
        remark: newRemark.trim()
      });
      setNewRemark('');
      if (onRemarkAdded) {
        onRemarkAdded(response.data);
      }
    } catch (error) {
      console.error('Error adding remark:', error);
      alert('Failed to add remark. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this remark?')) return;
    
    try {
      await clinicalRemarkService.delete(id);
      if (onRemarkAdded) {
        onRemarkAdded(); // Trigger refresh
      }
    } catch (error) {
      console.error('Error deleting remark:', error);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 'bold' }}>
        <NotesIcon /> Professional Remarks & Staff Notes
      </Typography>
      
      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.01)', borderRadius: 2 }}>
        {remarks.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2, textAlign: 'center' }}>
            No professional remarks have been recorded yet.
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ mb: 2 }}>
            {remarks.map((remark) => (
              <Box key={remark.id} sx={{ 
                p: 2, 
                bgcolor: 'white', 
                borderRadius: 2, 
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                borderLeft: `4px solid ${remark.author_role === 'DOCTOR' ? '#1976d2' : remark.author_role === 'DENTIST' ? '#2e7d32' : '#ed6c02'}`,
                position: 'relative'
              }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: remark.author_role === 'DOCTOR' ? 'primary.main' : remark.author_role === 'DENTIST' ? 'success.main' : 'warning.main', width: 32, height: 32 }}>
                    {remark.author_name?.[0] || 'U'}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {remark.author_name}
                      </Typography>
                      <Chip 
                        label={remark.author_role} 
                        size="small" 
                        variant="outlined" 
                        color={remark.author_role === 'DOCTOR' ? 'primary' : remark.author_role === 'DENTIST' ? 'success' : 'warning'}
                        sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        • {format(new Date(remark.created_at), 'MMM d, yyyy h:mm a')}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                      {remark.remark}
                    </Typography>
                  </Box>
                  {isMedicalStaff && user.id === remark.author && (
                    <Tooltip title="Delete Remark">
                      <IconButton size="small" onClick={() => handleDelete(remark.id)} sx={{ color: 'error.light' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}

        {!readOnly && isMedicalStaff && (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Add a Professional Remark
            </Typography>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="Leave a note or remark for other medical staff..."
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                multiline
                rows={2}
                disabled={submitting}
                sx={{ bgcolor: 'white' }}
              />
              <Button 
                variant="contained" 
                color="primary" 
                type="submit"
                disabled={!newRemark.trim() || submitting}
                sx={{ px: 3 }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ClinicalRemarks;
