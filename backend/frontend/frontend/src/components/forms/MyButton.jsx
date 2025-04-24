import React from 'react';
import Button from '@mui/material/Button';

export default function MyButton(props) {
  const { label, onClick, type = "button", disabled = false, variant = "contained", color = "primary", ...rest } = props;
  
  return (
    <Button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      variant={variant}
      color={color}
      fullWidth
      sx={{ mt: 2, mb: 2 }}
      {...rest}
    >
      {label}
    </Button>
  );
} 