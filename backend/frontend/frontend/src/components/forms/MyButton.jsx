import * as React from 'react';
import Button from '@mui/material/Button';

export default function MyButton(props) {
    const {label, type}=props
    return (
        <Button 
            type={type}
            className="myButton" 
            sx={{height:50}}
            variant="contained">{label}
        </Button>
    );
} 