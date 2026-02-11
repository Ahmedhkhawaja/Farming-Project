import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  CircularProgress,
  Alert,
  FormControl,
  Autocomplete,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const Stocks = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [marketLocation, setMarketLocation] = useState('Union Square, Manhattan');
  
  const marketLocations = [
    'Union Square, Manhattan',
    'Columbia University, West Manhattan',
    'Tribecca, Lower Manhattan',
    'Larchmont Westchester, NY',
    'Carroll Gardens, Brooklyn',
    'Jackson Heights, Queens'
  ];

  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const fetchStocks = async () => {
    setLoading(true);
    setError('');
    try {
      const formattedDate = formatDateForAPI(selectedDate);
      
      const response = await api.get('/stocks/daily', {
        params: {
          date: formattedDate,
          location: marketLocation
        }
      });
      
      setStocks(response.data || []);
    } catch (err) {
      console.error('Failed to fetch stocks:', err);
      setError('Failed to load stocks. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (marketLocation && selectedDate) {
      fetchStocks();
    }
  }, [marketLocation, selectedDate]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleLocationChange = (event, newValue) => {
    setMarketLocation(newValue || 'Union Square, Manhattan');
  };

  // Get weather for display (from first stock item)
  const getWeatherDisplay = () => {
    if (stocks.length === 0) return null;
    
    const firstStock = stocks[0];
    if (!firstStock.weatherCondition || firstStock.weatherCondition === 'Unknown') {
      return null;
    }
    
    let weatherText = firstStock.weatherCondition;
    if (firstStock.weatherTemperature) {
      weatherText += ` (${firstStock.weatherTemperature}°C)`;
    }
    
    return weatherText;
  };

  const weatherDisplay = getWeatherDisplay();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            View Stock
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/add-stocks"
          >
            Add New Stock
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {/* Filter Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filter Options
          </Typography>
          
          <Box display="flex" gap={3} flexWrap="wrap" alignItems="flex-end">
            {/* Date Picker */}
            <Box flex={1} minWidth="200px">
              <Typography variant="subtitle2" gutterBottom>
                Date
              </Typography>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                format="MM/dd/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    size: 'small'
                  }
                }}
              />
            </Box>
            
            {/* Location Selector */}
            <Box flex={1} minWidth="200px">
              <Typography variant="subtitle2" gutterBottom>
                Market Location
              </Typography>
              <FormControl fullWidth size="small">
                <Autocomplete
                  freeSolo
                  value={marketLocation}
                  onChange={handleLocationChange}
                  options={marketLocations}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select or type market location"
                    />
                  )}
                />
              </FormControl>
            </Box>
            
            {/* Refresh Button */}
            <Box>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={fetchStocks}
                disabled={loading}
              >
                {loading ? 'LOADING...' : 'REFRESH'}
              </Button>
            </Box>
          </Box>
        </Paper>
        
        {/* Simple Weather Display - Only shows if data exists */}
        {weatherDisplay && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: '#f0f9ff', border: '1px solid #b3e0ff' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              ☀️ Weather for {formatDateForDisplay(selectedDate)}: {weatherDisplay}
            </Typography>
          </Paper>
        )}
        
        {/* Stocks Table */}
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Stock Items for {marketLocation} on {formatDateForDisplay(selectedDate)}
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              {loading && stocks.length > 0 && <CircularProgress size={20} />}
              <Typography variant="body2" color="text.secondary">
                Total Items: {stocks.length}
              </Typography>
            </Box>
          </Box>
          
          {stocks.length === 0 && !loading ? (
            <Alert severity="info">
              No stock items found for {marketLocation} on {formatDateForDisplay(selectedDate)}.
              <Button 
                component={Link} 
                to="/add-stocks" 
                color="inherit" 
                sx={{ ml: 2 }}
              >
                Add Stock
              </Button>
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Product Type</strong></TableCell>
                    <TableCell><strong>Product Name</strong></TableCell>
                    <TableCell><strong>Sub Category</strong></TableCell>
                    <TableCell align="center"><strong>Total Stock</strong></TableCell>
                    <TableCell align="center"><strong>Return Qty</strong></TableCell>
                    <TableCell><strong>Unit</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stocks.map((stock) => (
                    <TableRow 
                      key={stock.id || stock._id}
                      hover
                    >
                      <TableCell>{stock.productType || 'N/A'}</TableCell>
                      <TableCell>{stock.productName || 'N/A'}</TableCell>
                      <TableCell>{stock.productSubCategory || 'N/A'}</TableCell>
                      <TableCell align="center">
                        <Typography variant="body1" fontWeight="bold">
                          {stock.totalStock || 0}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body1"
                          sx={{ 
                            color: stock.returnQty > 0 ? '#d35400' : 'inherit'
                          }}
                        >
                          {stock.returnQty || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>{stock.unit || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </LocalizationProvider>
  );
};

export default Stocks;