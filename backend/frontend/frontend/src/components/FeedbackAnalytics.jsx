import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // No longer needed directly
import { feedbackService } from '../services/api'; // Import the service
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import { Bar } from 'react-chartjs-2'; // Import Bar chart
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js'; // Import necessary Chart.js components

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const FeedbackAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chartData, setChartData] = useState({});
    const [chartOptions, setChartOptions] = useState({});

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            setError(null);
            try {
                // Use the feedbackService
                const response = await feedbackService.getAnalytics();
                setAnalytics(response.data);

                // Prepare chart data once analytics are fetched
                if (response.data && response.data.ratings_distribution) {
                    const labels = Object.keys(response.data.ratings_distribution).sort();
                    const dataValues = labels.map(label => response.data.ratings_distribution[label]);

                    setChartData({
                        labels: labels.map(l => `${l} Star${l !== '1' ? 's' : ''}`), // Format labels
                        datasets: [
                            {
                                label: 'Number of Ratings',
                                data: dataValues,
                                backgroundColor: 'rgba(75, 192, 192, 0.6)', // Example color
                                borderColor: 'rgba(75, 192, 192, 1)',
                                borderWidth: 1,
                            },
                        ],
                    });

                    setChartOptions({
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: 'Rating Distribution',
                            },
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1 // Ensure y-axis shows whole numbers for counts
                                }
                            }
                        }
                    });
                }

            } catch (err) {
                console.error("Error fetching feedback analytics:", err);
                // Use error message from service/interceptor if available
                setError(err.response?.data?.detail || err.message || 'Failed to load feedback analytics.');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
    }

    if (!analytics) {
        return <Alert severity="info" sx={{ mt: 2 }}>No analytics data available.</Alert>;
    }

    const renderDistributionList = (title, data) => (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>{title}</Typography>
                <List dense>
                    {Object.entries(data).map(([key, value]) => (
                        <ListItem key={key} disableGutters>
                            <ListItemText primary={`${key}: ${value}`} />
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );

    return (
        <Box sx={{ mt: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom component="div">
                Feedback Analytics Summary
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Total Feedback Entries
                            </Typography>
                            <Typography variant="h4" component="div">
                                {analytics.total_feedback}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Average Rating (1-5)
                            </Typography>
                            <Typography variant="h4" component="div">
                                {analytics.average_rating !== null ? analytics.average_rating : 'N/A'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    {analytics.total_feedback > 0 && chartData.labels ? (
                        <Card>
                            <CardContent>
                                <Bar options={chartOptions} data={chartData} />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent>
                                <Typography variant="subtitle1" color="text.secondary">No rating data available for chart.</Typography>
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                <Grid item xs={12} md={6}>
                    {renderDistributionList("Staff Courteous?", analytics.courteous_counts)}
                </Grid>
                 <Grid item xs={12} md={6}>
                    {renderDistributionList("Recommend Service?", analytics.recommend_counts)}
                </Grid>

            </Grid>
            <Divider sx={{ my: 3 }} />
        </Box>
    );
};

export default FeedbackAnalytics; 