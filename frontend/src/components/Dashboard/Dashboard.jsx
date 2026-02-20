import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InventoryIcon from '@mui/icons-material/Inventory';
import SellIcon from '@mui/icons-material/Sell';

import api from '../../services/api'; // Use the raw api instance for pagination

const Dashboard = () => {
  const [productType, setProductType] = useState('Greens');
  const [marketLocation, setMarketLocation] = useState('All Locations');

  const marketLocations = [
    { name: 'All Locations' },
    { name: 'Union Square (Monday) Manhattan' },
    { name: 'Union Square (Wednesday) Manhattan' },
    { name: 'Columbia University (Thursday) Upper west side Manhattan' },
    { name: 'Union Square (Saturday) Manhattan' },
    { name: 'Tribecca (Saturday) Lower Manhattan' },
    { name: 'Larchmont (Saturday) Westchester NY' },
    { name: 'Carrol Gardens (Sunday) Brooklyn' },
    { name: 'Jackson Heights (Sunday) Queens' }
  ];

  const [stats, setStats] = useState({
    today: { totalStock: 0, stockSold: 0, stockReturned: 0 },
    thisMonth: { totalStock: 0, stockSold: 0, stockReturned: 0 },
    thisYear: { totalStock: 0, stockSold: 0, stockReturned: 0 },
    allTime: { totalStock: 0, stockSold: 0, stockReturned: 0 }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [productType, marketLocation]);

  const formatDateForAPI = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // ----- FETCH ALL STOCKS WITH PAGINATION -----
      let allStocks = [];
      let page = 1;
      const limit = 100; // adjust if your backend supports a higher limit
      let hasMore = true;

      while (hasMore) {
        // Use the raw api instance with query params
        const response = await api.get('/stocks', { params: { page, limit } });
        // The response could be an array directly or contain a 'stocks' field
        const stocks = response.data?.stocks || response.data || [];
        
        if (!Array.isArray(stocks)) {
          console.error('Unexpected API response format:', response.data);
          break;
        }

        allStocks = [...allStocks, ...stocks];
        
        // Stop if we got fewer items than the limit (last page)
        if (stocks.length < limit) {
          hasMore = false;
        } else {
          page++;
        }
      }

      console.log('All stocks from API (after pagination):', allStocks);

      if (!allStocks.length) {
        setLoading(false);
        return;
      }

      // ----- FILTER BY PRODUCT TYPE -----
      const normalizedFilterType = productType.trim();
      const filteredByProduct = allStocks.filter(stock => {
        const stockType = stock.productType?.trim() || '';
        return stockType.toLowerCase() === normalizedFilterType.toLowerCase();
      });

      // ----- FILTER BY MARKET LOCATION -----
      let filteredStocks = filteredByProduct;
      if (marketLocation !== 'All Locations') {
        filteredStocks = filteredByProduct.filter(stock => 
          stock.location && stock.location.trim() === marketLocation.trim()
        );
      }

      console.log(`Filtered stocks for "${productType}" and "${marketLocation}":`, filteredStocks);

      const today = new Date();
      const todayStr = formatDateForAPI(today);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthStartStr = formatDateForAPI(monthStart);
      const yearStart = new Date(today.getFullYear(), 0, 1);
      const yearStartStr = formatDateForAPI(yearStart);

      setStats({
        today: calculateStatsForDateRange(filteredStocks, todayStr, todayStr),
        thisMonth: calculateStatsForDateRange(filteredStocks, monthStartStr, todayStr),
        thisYear: calculateStatsForDateRange(filteredStocks, yearStartStr, todayStr),
        allTime: calculateStatsForDateRange(filteredStocks)
      });

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatsForDateRange = (stocks, startDate = null, endDate = null) => {
    let filtered = stocks;

    if (startDate && endDate) {
      filtered = stocks.filter(s => {
        if (!s.date) return false;
        let stockDate = s.date;
        if (stockDate.includes('T')) stockDate = stockDate.split('T')[0];
        return String(stockDate) >= String(startDate) && 
               String(stockDate) <= String(endDate);
      });
    }

    // Debug: show location of first item if any
    if (filtered.length > 0) {
      console.log('First filtered item location:', filtered[0].location);
      console.log('Sample item:', filtered[0]);
    }

    const total = filtered.reduce((sum, item) => sum + (item.totalStock || 0), 0);
    const sold = filtered.reduce((sum, item) => sum + (item.soldQty || 0), 0);
    const returned = filtered.reduce((sum, item) => sum + (item.returnQty || 0), 0);

    console.log(`Stats for range ${startDate || 'all'} to ${endDate || 'all'}:`, {
      totalStock: total,
      stockSold: sold,
      stockReturned: returned
    });

    return {
      totalStock: total,
      stockSold: sold,
      stockReturned: returned
    };
  };

  const StatCard = ({ title, icon: Icon, value, color = 'primary' }) => (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        background: 'rgba(255,255,255,0.92)',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid rgba(255,255,255,0.4)',
        transition: 'all 0.25s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.18)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '12px',
              background: `${color}.light`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.12)'
            }}
          >
            <Icon sx={{ color: `${color}.main`, fontSize: 28 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#111827' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  const getCardTitles = () => {
    if (productType === 'Greens') {
      return {
        total: 'Total Crate(s)',
        sold: 'Crate(s) Sold',
        returned: 'Crate(s) Returned'
      };
    } else {
      return {
        total: 'Total Item(s)',
        sold: 'Item(s) Sold',
        returned: 'Item(s) Returned'
      };
    }
  };

  const cardTitles = getCardTitles();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=2000&q=80')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          zIndex: 1
        }
      }}
    >
      <Container sx={{ position: 'relative', zIndex: 2, py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
          <Typography variant="h4" sx={{ color: '#2c3e50', fontWeight: 700 }}>
            Sales Dashboard
          </Typography>
          <Box display="flex" gap={2}>
            <FormControl sx={{ minWidth: 200, backgroundColor: 'white', borderRadius: '8px' }}>
              <InputLabel>Market Location</InputLabel>
              <Select
                value={marketLocation}
                label="Market Location"
                onChange={(e) => setMarketLocation(e.target.value)}
              >
                {marketLocations.map(loc => (
                  <MenuItem key={loc.name} value={loc.name}>{loc.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 200, backgroundColor: 'white', borderRadius: '8px' }}>
              <InputLabel>Product Type</InputLabel>
              <Select
                value={productType}
                label="Product Type"
                onChange={(e) => setProductType(e.target.value)}
              >
                <MenuItem value="Greens">Greens</MenuItem>
                <MenuItem value="Kitchen">Kitchen</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '8px', backdropFilter: 'blur(5px)' }}>
            {error}
          </Alert>
        )}

        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600, mt: 2 }}>
          Today
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title={cardTitles.total} icon={InventoryIcon} value={stats.today.totalStock} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title={cardTitles.sold} icon={SellIcon} value={stats.today.stockSold} color="success" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title={cardTitles.returned} icon={TrendingDownIcon} value={stats.today.stockReturned} color="error" />
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
          This Month
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title={cardTitles.total} icon={InventoryIcon} value={stats.thisMonth.totalStock} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title={cardTitles.sold} icon={SellIcon} value={stats.thisMonth.stockSold} color="success" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard title={cardTitles.returned} icon={TrendingDownIcon} value={stats.thisMonth.stockReturned} color="error" />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(255,255,255,0.4)'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                This Year Summary
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ color: '#34495e' }}>{cardTitles.total}:</Typography>
                  <Typography fontWeight="bold" sx={{ color: '#111827' }}>
                    {stats.thisYear.totalStock}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ color: '#34495e' }}>{cardTitles.sold}:</Typography>
                  <Typography fontWeight="bold" color="success.main">
                    {stats.thisYear.stockSold}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ color: '#34495e' }}>{cardTitles.returned}:</Typography>
                  <Typography fontWeight="bold" color="error.main">
                    {stats.thisYear.stockReturned}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                p: 3,
                backdropFilter: 'blur(10px)',
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid rgba(255,255,255,0.4)'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
                All Time Summary
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ color: '#34495e' }}>{cardTitles.total}:</Typography>
                  <Typography fontWeight="bold" sx={{ color: '#111827' }}>
                    {stats.allTime.totalStock}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ color: '#34495e' }}>{cardTitles.sold}:</Typography>
                  <Typography fontWeight="bold" color="success.main">
                    {stats.allTime.stockSold}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography sx={{ color: '#34495e' }}>{cardTitles.returned}:</Typography>
                  <Typography fontWeight="bold" color="error.main">
                    {stats.allTime.stockReturned}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Box display="flex" justifyContent="flex-end" mt={3}>
          <button
            onClick={fetchDashboardData}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #1b5e20 0%, #0d3b12 100%)';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(46, 125, 50, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Refresh Dashboard
          </button>
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;