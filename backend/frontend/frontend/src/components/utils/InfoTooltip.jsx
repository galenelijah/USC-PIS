import React from 'react';
import { Tooltip, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Lightweight, reusable info tooltip with a small info icon.
// Usage: <InfoTooltip title="Helpful hint about this section" />
const InfoTooltip = ({ title, placement = 'right', size = 'small', sx = {} }) => {
  if (!title) return null;
  return (
    <Tooltip title={title} placement={placement} arrow>
      <IconButton size={size} sx={{ p: 0.5, ml: 1, opacity: 0.8, ...sx }} aria-label="help">
        <InfoOutlinedIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
};

export default InfoTooltip;

