import React, { useState } from 'react';
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

const HealthInfo = () => {
  const theme = useTheme();
  const [healthInfo, setHealthInfo] = useState([
    {
      id: 1,
      title: 'COVID-19 Prevention Guidelines',
      content: 'Stay safe by following these guidelines...',
      date: '2024-03-20',
      category: 'Infectious Diseases',
    },
    {
      id: 2,
      title: 'Mental Health Awareness',
      content: 'Tips for maintaining good mental health...',
      date: '2024-03-19',
      category: 'Mental Health',
    },
  ]);

  const [newInfo, setNewInfo] = useState({
    title: '',
    content: '',
    category: '',
  });

  const handleAddInfo = () => {
    if (newInfo.title && newInfo.content && newInfo.category) {
      setHealthInfo([
        ...healthInfo,
        {
          id: Date.now(),
          ...newInfo,
          date: new Date().toISOString().split('T')[0],
        },
      ]);
      setNewInfo({ title: '', content: '', category: '' });
    }
  };

  const handleDeleteInfo = (id) => {
    setHealthInfo(healthInfo.filter((info) => info.id !== id));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom color="primary">
        Health Information Dissemination
      </Typography>

      {/* Add New Health Information */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3,
          borderLeft: `4px solid ${theme.palette.primary.main}`,
        }}
      >
        <Typography variant="h6" gutterBottom color="primary">
          Add New Health Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Title"
              value={newInfo.title}
              onChange={(e) => setNewInfo({ ...newInfo, title: e.target.value })}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Category"
              value={newInfo.category}
              onChange={(e) => setNewInfo({ ...newInfo, category: e.target.value })}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Content"
              value={newInfo.content}
              onChange={(e) => setNewInfo({ ...newInfo, content: e.target.value })}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddInfo}
              disabled={!newInfo.title || !newInfo.content || !newInfo.category}
            >
              Add Information
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Health Information List */}
      <Paper 
        sx={{ 
          p: 3,
          borderLeft: `4px solid ${theme.palette.secondary.main}`,
        }}
      >
        <Typography variant="h6" gutterBottom color="secondary">
          Health Information List
        </Typography>
        <List>
          {healthInfo.map((info) => (
            <React.Fragment key={info.id}>
              <ListItem
                sx={{
                  bgcolor: 'background.paper',
                  mb: 1,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
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
                        Posted on: {info.date}
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="edit" color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDeleteInfo(info.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
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