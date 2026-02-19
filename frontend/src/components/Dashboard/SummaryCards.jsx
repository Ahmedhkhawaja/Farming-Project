import React from 'react';
import { 
    Grid, 
    Paper, 
    Typography, 
    Box 
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    Inventory,
    AttachMoney
} from '@mui/icons-material';

const SummaryCards = ({ summary }) => {
    // Check if summary exists and has the expected structure
    if (!summary || 
        !summary.today || 
        !summary.month || 
        !summary.year || 
        !summary.allTime) {
        return (
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography>Loading summary data...</Typography>
                </Grid>
            </Grid>
        );
    }

    const cards = [
        {
            title: 'Today',
            totalStock: summary.today?.totalStock || 0,
            stockSold: summary.today?.stockSold || 0,
            stockReturned: summary.today?.stockReturned || 0,
            color: '#1976d2',
            icon: <Inventory />
        },
        {
            title: 'This Month 123',
            totalStock: summary.month?.totalStock || 0,
            stockSold: summary.month?.stockSold || 0,
            stockReturned: summary.month?.stockReturned || 0,
            color: '#2e7d32',
            icon: <TrendingUp />
        },
        {
            title: 'This Year',
            totalStock: summary.year?.totalStock || 0,
            stockSold: summary.year?.stockSold || 0,
            stockReturned: summary.year?.stockReturned || 0,
            color: '#ed6c02',
            icon: <AttachMoney />
        },
        {
            title: 'All Time',
            totalStock: summary.allTime?.totalStock || 0,
            stockSold: summary.allTime?.stockSold || 0,
            stockReturned: summary.allTime?.stockReturned || 0,
            color: '#9c27b0',
            icon: <TrendingDown />
        }
    ];

    return (
        <Grid container spacing={3}>
            {cards.map((card, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                    <Paper 
                        sx={{ 
                            p: 2,
                            borderLeft: `4px solid ${card.color}`,
                            '&:hover': {
                                boxShadow: 3
                            }
                        }}
                    >
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                                <Typography color="textSecondary" variant="body2">
                                    {card.title}
                                </Typography>
                                <Typography variant="h6">
                                    Total: {card.totalStock}
                                </Typography>
                                <Typography variant="body2" color="success.main">
                                    Sold: {card.stockSold}
                                </Typography>
                                <Typography variant="body2" color="error.main">
                                    Returned: {card.stockReturned}
                                </Typography>
                                <Typography variant="body2" color="info.main">
                                    Available: {card.totalStock - card.stockSold - card.stockReturned}
                                </Typography>
                            </Box>
                            <Box sx={{ color: card.color }}>
                                {card.icon}
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    );
};

export default SummaryCards;


