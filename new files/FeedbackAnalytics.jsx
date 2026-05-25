import React from 'react';
import { Box, Card, CardContent, Typography, Divider } from '@mui/material';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const FeedbackAnalytics = ({ feedbackList }) => {
    // 1. Calculate Aggregations dynamically from the filtered dataset
    const totalFeedback = feedbackList.length;
    
    const averageRating = totalFeedback > 0 
        ? (feedbackList.reduce((acc, curr) => acc + curr.rating, 0) / totalFeedback).toFixed(1)
        : 'N/A';

    // Initialize distributions
    const ratingsDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const courteousCounts = {};
    const recommendCounts = {};

    feedbackList.forEach(item => {
        // Star count distributions
        if (ratingsDistribution[item.rating] !== undefined) {
            ratingsDistribution[item.rating]++;
        }
        // Courtesy text distributions
        const courteousRaw = item.courteous ? String(item.courteous).trim() : 'N/A';
        const courteousKey = courteousRaw.toLowerCase() === 'yes' ? 'Yes' : courteousRaw.toLowerCase() === 'no' ? 'No' : courteousRaw;
        courteousCounts[courteousKey] = (courteousCounts[courteousKey] || 0) + 1;
        
        // Recommendation text distributions
        const recommendRaw = item.recommend ? String(item.recommend).trim() : 'N/A';
        const recommendKey = recommendRaw.toLowerCase() === 'yes' ? 'Yes' : recommendRaw.toLowerCase() === 'no' ? 'No' : recommendRaw;
        recommendCounts[recommendKey] = (recommendCounts[recommendKey] || 0) + 1;
    });

    // 2. Map Bar Chart Data
    const barLabels = Object.keys(ratingsDistribution).sort();
    const ratingChartData = {
        labels: barLabels.map(l => `${l} Star${l !== '1' ? 's' : ''}`),
        datasets: [{
            label: 'Number of Ratings',
            data: barLabels.map(label => ratingsDistribution[label]),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        }],
    };

    const ratingChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Rating Distribution', font: { size: 16, weight: 'bold' } },
        },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    };

    // 3. Map Donut Charts Configuration
    const generateDonutData = (countsData, label) => {
        const labels = Object.keys(countsData);
        const dataValues = Object.values(countsData);
        const colorMap = {
            'yes': 'rgba(46, 125, 50, 0.7)',
            'no': 'rgba(211, 47, 47, 0.7)',
            'maybe': 'rgba(237, 108, 2, 0.7)',
            'n/a': 'rgba(158, 158, 158, 0.7)'
        };
        return {
            labels,
            datasets: [{
                label,
                data: dataValues,
                backgroundColor: labels.map(l => colorMap[l.toLowerCase()] || 'rgba(0, 172, 193, 0.7)'),
                borderColor: labels.map(l => colorMap[l.toLowerCase()]?.replace('0.7', '1') || 'rgba(0, 172, 193, 1)'),
                borderWidth: 1,
            }],
        };
    };

    const donutOptions = (titleText) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right', labels: { boxWidth: 10, padding: 6, font: { size: 11 } } },
            title: { display: true, text: titleText, font: { size: 14, weight: 'bold' }, align: 'start' },
        },
    });

    return (
        <Box sx={{ mt: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
                Feedback Analytics Summary
            </Typography>
            
            {/* Top Cards: Metrics Scoreboards */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                <Card sx={{ flex: 1, textAlign: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    <CardContent>
                        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>Total Feedback Entries</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{totalFeedback}</Typography>
                    </CardContent>
                </Card>
                <Card sx={{ flex: 1, textAlign: 'center', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                    <CardContent>
                        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>Average Rating</Typography>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{averageRating} {totalFeedback > 0 && '★'}</Typography>
                    </CardContent>
                </Card>
            </Box>

            {/* Bottom Section: Custom 70/30 Row Split Layout */}
            <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', md: 'row' }, 
                gap: 3, 
                alignItems: 'stretch' 
            }}>
                
                {/* 1. Bar Chart: Left Side (Locked exactly at 70% minus gap share) */}
                <Box sx={{ flex: { xs: '1 1 auto', md: '0 0 calc(70% - 12px)' }, minWidth: 0 }}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ height: 440 }}>
                            <Bar options={ratingChartOptions} data={ratingChartData} />
                        </CardContent>
                    </Card>
                </Box>

                {/* 2. Stacked Containers: Right Side (Locked exactly at 30% minus gap share) */}
                <Box sx={{ 
                    flex: { xs: '1 1 auto', md: '0 0 calc(30% - 12px)' }, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2,
                    minWidth: 0 
                }}>
                    
                    {/* Staff Courteous Donut */}
                    <Card sx={{ flex: 1 }}>
                        <CardContent sx={{ height: 208, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {totalFeedback > 0 ? (
                                <Box sx={{ width: '100%', height: '100%' }}>
                                    <Doughnut data={generateDonutData(courteousCounts, 'Courteous')} options={donutOptions('Staff Courteous?')} />
                                </Box>
                            ) : (
                                <Typography color="text.secondary">No courtesy data available.</Typography>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recommend Service Donut */}
                    <Card sx={{ flex: 1 }}>
                        <CardContent sx={{ height: 208, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {totalFeedback > 0 ? (
                                <Box sx={{ width: '100%', height: '100%' }}>
                                    <Doughnut data={generateDonutData(recommendCounts, 'Recommend')} options={donutOptions('Recommend Service?')} />
                                </Box>
                            ) : (
                                <Typography color="text.secondary">No recommendation data available.</Typography>
                            )}
                        </CardContent>
                    </Card>

                </Box>

            </Box>
            <Divider sx={{ my: 3 }} />
        </Box>
    );
};

export default FeedbackAnalytics;