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
  Alert
} from '@mui/material';

import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InventoryIcon from '@mui/icons-material/Inventory';
import SellIcon from '@mui/icons-material/Sell';

import { stockAPI } from '../../services/api';

const Dashboard = () => {

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
  }, []);

  const fetchDashboardData = async () => {
    try {

      setLoading(true);
      setError('');

      const res = await stockAPI.getAll();

      const stocks = res.data?.stocks || res.data || [];

      if (!stocks.length) {
        setLoading(false);
        return;
      }

      const today = new Date();

      const todayStr = today.toISOString().split('T')[0];

      const monthStart =
        new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split('T')[0];

      const yearStart =
        new Date(today.getFullYear(), 0, 1)
          .toISOString()
          .split('T')[0];

      setStats({
        today: calculateStatsForDateRange(stocks, todayStr, todayStr),
        thisMonth: calculateStatsForDateRange(stocks, monthStart, todayStr),
        thisYear: calculateStatsForDateRange(stocks, yearStart, todayStr),
        allTime: calculateStatsForDateRange(stocks)
      });

    } catch (err) {

      console.error('Failed to fetch dashboard data:', err);

      setError('Failed to load dashboard data');

    } finally {

      setLoading(false);

    }
  };

  const calculateStatsForDateRange = (
    stocks,
    startDate = null,
    endDate = null
  ) => {

    let filtered = stocks;

    if (startDate && endDate) {

      filtered = stocks.filter(s => {

        if (!s.date) return false;

        const d =
          new Date(s.date).toISOString().split('T')[0];

        return d >= startDate && d <= endDate;

      });
    }

    const totalStock =
      filtered.reduce(
        (sum, s) => sum + (s.totalStock || 0),
        0
      );

    const stockSold =
      filtered.reduce(
        (sum, s) =>
          sum + (s.stockSold ?? s.soldQty ?? 0),
        0
      );

    const stockReturned =
      filtered.reduce(
        (sum, s) =>
          sum + (s.stockReturned ?? s.returnQty ?? 0),
        0
      );

    return {
      totalStock,
      stockSold,
      stockReturned
    };
  };


  /*
  ============================================
  IMPROVED STAT CARD DESIGN
  ============================================
  */

  const StatCard = ({
    title,
    icon: Icon,
    value,
    color = 'primary'
  }) => (

    <Card
      elevation={0}
      sx={{
        height: '100%',

        background:
          'rgba(255,255,255,0.92)',

        borderRadius: '16px',

        boxShadow:
          '0 4px 20px rgba(0,0,0,0.08)',

        border:
          '1px solid rgba(255,255,255,0.4)',

        transition: 'all 0.25s ease',

        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow:
            '0 12px 30px rgba(0,0,0,0.18)'
        }
      }}
    >

      <CardContent sx={{ p: 3 }}>

        <Box
          display="flex"
          alignItems="center"
          gap={2}
          mb={2}
        >

          <Box
            sx={{
              width: 52,
              height: 52,

              borderRadius: '12px',

              background:
                `${color}.light`,

              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',

              boxShadow:
                '0 4px 10px rgba(0,0,0,0.12)'
            }}
          >
            <Icon
              sx={{
                color:
                  `${color}.main`,
                fontSize: 28
              }}
            />
          </Box>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: '#374151'
            }}
          >
            {title}
          </Typography>

        </Box>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: '#111827'
          }}
        >
          {value}
        </Typography>

      </CardContent>

    </Card>
  );


  /*
  ============================================
  LOADING STATE
  ============================================
  */

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }


  /*
  ============================================
  MAIN DASHBOARD UI
  ============================================
  */

  return (

    <Box
      sx={{

        minHeight: '100vh',

        backgroundImage:
          `url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854')`,

        backgroundSize: 'cover',

        backgroundPosition: 'center',

        backgroundRepeat: 'no-repeat',

        py: 4,

        position: 'relative'
      }}
    >

      {/* Green overlay */}
      <Box
        sx={{
          position: 'absolute',

          top: 0,
          left: 0,

          width: '100%',
          height: '100%',

          backgroundColor:
            'rgba(34,139,34,0.25)',

          zIndex: 0
        }}
      />

      <Container
        sx={{
          position: 'relative',
          zIndex: 1
        }}
      >

<Typography
  variant="h4"
  gutterBottom
  sx={{
    color: '#0f3d0f',
    fontWeight: 700,
    textShadow: '0 2px 6px rgba(255,255,255,0.6)',
    letterSpacing: '0.5px'
  }}
>
  Sales Dashboard
</Typography>


        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}


        {/* TODAY */}
<Typography
  variant="h6"
  gutterBottom
  sx={{
    mt: 3,
    color: '#145214',
    fontWeight: 600,
    textShadow: '0 1px 4px rgba(255,255,255,0.7)'
  }}
>
  Today
</Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>

          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Stock"
              icon={InventoryIcon}
              value={stats.today.totalStock}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Stock Sold"
              icon={SellIcon}
              value={stats.today.stockSold}
              color="success"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Stock Returned"
              icon={TrendingDownIcon}
              value={stats.today.stockReturned}
              color="error"
            />
          </Grid>

        </Grid>


        {/* THIS MONTH */}
<Typography
  variant="h6"
  gutterBottom
  sx={{
    color: '#145214',
    fontWeight: 600,
    textShadow: '0 1px 4px rgba(255,255,255,0.7)'
  }}
>
  This Month
</Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>

          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Total Stock"
              icon={InventoryIcon}
              value={stats.thisMonth.totalStock}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Stock Sold"
              icon={SellIcon}
              value={stats.thisMonth.stockSold}
              color="success"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Stock Returned"
              icon={TrendingDownIcon}
              value={stats.thisMonth.stockReturned}
              color="error"
            />
          </Grid>

        </Grid>


        {/* YEAR + ALL TIME */}
        <Grid container spacing={3}>

          <Grid item xs={12} md={6}>

            <Paper
              sx={{
                p: 3,

                backgroundColor:
                  'rgba(255,255,255,0.9)',

                borderRadius: '16px',

                boxShadow:
                  '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >

              <Typography
                variant="h6"
                gutterBottom
              >
                This Year Summary
              </Typography>

              <Box
                display="flex"
                flexDirection="column"
                gap={2}
              >

                <Box
                  display="flex"
                  justifyContent="space-between"
                >
                  <Typography>
                    Total Stock:
                  </Typography>

                  <Typography fontWeight="bold">
                    {stats.thisYear.totalStock}
                  </Typography>
                </Box>


                <Box
                  display="flex"
                  justifyContent="space-between"
                >
                  <Typography>
                    Total Sold:
                  </Typography>

                  <Typography
                    fontWeight="bold"
                    color="success.main"
                  >
                    {stats.thisYear.stockSold}
                  </Typography>
                </Box>


                <Box
                  display="flex"
                  justifyContent="space-between"
                >
                  <Typography>
                    Total Returned:
                  </Typography>

                  <Typography
                    fontWeight="bold"
                    color="error.main"
                  >
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

                backgroundColor:
                  'rgba(255,255,255,0.9)',

                borderRadius: '16px',

                boxShadow:
                  '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >

              <Typography
                variant="h6"
                gutterBottom
              >
                All Time Summary
              </Typography>

              <Box
                display="flex"
                flexDirection="column"
                gap={2}
              >

                <Box
                  display="flex"
                  justifyContent="space-between"
                >
                  <Typography>
                    Total Stock:
                  </Typography>

                  <Typography fontWeight="bold">
                    {stats.allTime.totalStock}
                  </Typography>
                </Box>


                <Box
                  display="flex"
                  justifyContent="space-between"
                >
                  <Typography>
                    Total Sold:
                  </Typography>

                  <Typography
                    fontWeight="bold"
                    color="success.main"
                  >
                    {stats.allTime.stockSold}
                  </Typography>
                </Box>


                <Box
                  display="flex"
                  justifyContent="space-between"
                >
                  <Typography>
                    Total Returned:
                  </Typography>

                  <Typography
                    fontWeight="bold"
                    color="error.main"
                  >
                    {stats.allTime.stockReturned}
                  </Typography>
                </Box>

              </Box>

            </Paper>

          </Grid>

        </Grid>


        {/* REFRESH BUTTON */}
        <Box
          display="flex"
          justifyContent="flex-end"
          mt={3}
        >

          <button
            onClick={fetchDashboardData}
            style={{
              padding: '10px 20px',

              backgroundColor: '#2e7d32',

              color: 'white',

              border: 'none',

              borderRadius: '6px',

              fontWeight: 600,

              cursor: 'pointer'
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