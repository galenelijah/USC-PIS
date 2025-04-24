import * as React from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import { Box } from '@mui/material';
import '../../App.css';

export default function ProfileCard(props) {
    const { name, course, content } = props;
    const [expanded, setExpanded] = React.useState(false);
    const cardRef = React.useRef(null); // Reference to the card

    const handleExpandClick = () => {
        setExpanded(!expanded);
    };

    // Close card when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (cardRef.current && !cardRef.current.contains(event.target)) {
                setExpanded(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <Box ref={cardRef}>
            <Card sx={{ minWidth: 600, maxWidth: 600, margin: '10px' }}>
                <CardHeader
                    avatar={
                        <Avatar sx={{ bgcolor: 'black' }} aria-label="profile">
                            {name.charAt(0)}
                        </Avatar>
                    }
                    title={name}
                    subheader={`${course}`}
                    onClick={handleExpandClick}
                    aria-expanded={expanded}
                    aria-label="show more"
                />

                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Box className="loginBox">
                        <Box>{content}</Box>
                    </Box>
                </Collapse>
            </Card>
        </Box>
    );
} 