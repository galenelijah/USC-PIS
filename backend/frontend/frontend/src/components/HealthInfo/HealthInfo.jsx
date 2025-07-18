import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHealthInfo, addHealthInfo, updateHealthInfo, deleteHealthInfo, setEditing, clearEditing } from '../../features/healthInfoSlice';
import { selectCurrentUser } from '../../features/authentication/authSlice';

const HealthInfo = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { list: healthInfo = [], loading, error, editing } = useSelector(state => state.healthInfo);
  const user = useSelector(selectCurrentUser);
  const [form, setForm] = useState({ title: '', content: '', category: '' });

  useEffect(() => { dispatch(fetchHealthInfo()); }, [dispatch]);
  useEffect(() => {
    if (editing) setForm(editing);
    else setForm({ title: '', content: '', category: '' });
  }, [editing]);

  const isStaff = user && (user.role === 'ADMIN' || user.role === 'STAFF');
  const isStudent = user && user.role === 'STUDENT';
  const isPatient = user && user.role === 'PATIENT';
  const isReadOnly = !isStaff;

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = e => {
    e.preventDefault();
    if (editing) {
      dispatch(updateHealthInfo({ id: editing.id, data: form })).then(() => dispatch(clearEditing()));
    } else {
      dispatch(addHealthInfo(form));
    }
    setForm({ title: '', content: '', category: '' });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        Health Information Dissemination
      </Typography>
      <Box sx={{ mb: 2 }}>
        {isStaff && <Typography color="success.main">Admin/Staff View</Typography>}
        {(isStudent || isPatient) && <Typography color="info.main">Patient/Student View (Read-Only)</Typography>}
      </Box>

      {/* Add/Edit Health Information (Staff/Admin only) */}
      {isStaff && (
        <Paper sx={{ p: 3, mb: 3, borderLeft: `4px solid ${theme.palette.primary.main}` }}>
          <Typography variant="h6" gutterBottom color="primary">
            {editing ? 'Edit Health Information' : 'Add New Health Information'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  variant="outlined"
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  variant="outlined"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Content"
                  name="content"
                  value={form.content}
                  onChange={handleChange}
                  variant="outlined"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={editing ? <EditIcon /> : <AddIcon />}
                  type="submit"
                  disabled={!form.title || !form.content || !form.category}
                >
                  {editing ? 'Update Information' : 'Add Information'}
                </Button>
                {editing && (
                  <Button sx={{ ml: 2 }} variant="outlined" color="secondary" onClick={() => dispatch(clearEditing())}>
                    Cancel
                  </Button>
                )}
              </Grid>
            </Grid>
          </form>
        </Paper>
      )}

      {/* Health Information List */}
      <Paper sx={{ p: 3, borderLeft: `4px solid ${theme.palette.secondary.main}` }}>
        <Typography variant="h6" gutterBottom color="secondary">
          Health Information List
        </Typography>
        {loading && <Typography>Loading...</Typography>}
        {error && <Typography color="error">Error: {error}</Typography>}
        <List>
          {healthInfo.map((info) => (
            <React.Fragment key={info.id}>
              <ListItem
                sx={{
                  bgcolor: 'background.paper',
                  mb: 1,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="h6" component="div" color="primary">
                      {info.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="secondary">
                        {info.category}
                      </Typography>
                      {` — ${info.content}`}
                      <br />
                      <Typography component="span" variant="caption" color="text.secondary">
                        Posted on: {new Date(info.created_at).toLocaleDateString()}
                      </Typography>
                    </>
                  }
                />
                {isStaff && (
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="edit" color="primary" onClick={() => dispatch(setEditing(info))}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => dispatch(deleteHealthInfo(info.id))} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default HealthInfo; 