// ReturnStock.jsx - Fixed with correct Final Remaining calculation
import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Box,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../services/api';
import '../ReturnStock.css';

const ReturnStock = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [marketLocation, setMarketLocation] = useState('Union Square, Manhattan');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Stock items state
  const [stockItems, setStockItems] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editReturnQty, setEditReturnQty] = useState('');
  
  // Market locations
  const marketLocations = [
    'Union Square, Manhattan',
    'Columbia University, West Manhattan',
    'Tribecca, Lower Manhattan',
    'Larchmont Westchester, NY',
    'Carroll Gardens, Brooklyn',
    'Jackson Heights, Queens'
  ];

  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Fetch stock for selected date and location
  const fetchStockForDay = async () => {
    try {
      setLoading(true);
      setError('');
      
      const formattedDate = formatDateForAPI(selectedDate);
      
      console.log("📡 API Request:", {
        date: formattedDate,
        location: marketLocation
      });
      
      const response = await api.get('/stocks/daily', {
        params: {
          date: formattedDate,
          location: marketLocation
        }
      });
      
      console.log("✅ API Response:", response.data);
      console.log("📊 Response length:", response.data.length);
      
      // DEBUG: Show what data we're receiving
      if (response.data.length > 0) {
        console.log("🔍 Sample item from API:", response.data[0]);
        console.log("Sample item totalStock:", response.data[0].totalStock);
        console.log("Sample item remainingQty:", response.data[0].remainingQty);
        console.log("Sample item returnQty:", response.data[0].returnQty);
      }
      
      // Transform API response
      const transformedItems = response.data.map(item => ({
        id: item.id,
        productType: item.productType,
        productName: item.productName,
        productSubCategory: item.productSubCategory,
        totalStock: item.totalStock || 0,
        soldQty: item.soldQty || 0,
        remainingQty: item.remainingQty || 0,
        returnQty: item.returnQty || 0,
        unit: item.unit || '',
        // FINAL REMAINING = TOTAL STOCK - RETURN QTY (not remainingQty - returnQty)
        finalRemainingQty: (item.totalStock || 0) - (item.returnQty || 0)
      }));
      
      console.log("🔄 Transformed items:", transformedItems);
      if (transformedItems.length > 0) {
        console.log("📐 First item calculation:", {
          totalStock: transformedItems[0].totalStock,
          returnQty: transformedItems[0].returnQty,
          calculation: `${transformedItems[0].totalStock} - ${transformedItems[0].returnQty} = ${transformedItems[0].finalRemainingQty}`
        });
      }
      
      setStockItems(transformedItems);
      setOriginalItems(JSON.parse(JSON.stringify(transformedItems)));
      
    } catch (err) {
      console.error('❌ Error fetching stock:', err);
      setError('Failed to fetch stock data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock when date or location changes
  useEffect(() => {
    if (marketLocation && selectedDate) {
      fetchStockForDay();
    }
  }, [marketLocation, selectedDate]);

  // Handle edit click
  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditReturnQty(item.returnQty.toString());
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditReturnQty('');
  };

  // Handle save edit for a single item
  const handleSaveEdit = (itemId) => {
    const returnQty = parseInt(editReturnQty) || 0;
    const item = stockItems.find(item => item.id === itemId);
    
    if (!item) return;
    
    // Validate return quantity doesn't exceed total stock
    if (returnQty > item.totalStock) {
      alert(`Return quantity cannot exceed total stock (${item.totalStock})`);
      return;
    }
    
    // Update the item
    const updatedItems = stockItems.map(item => {
      if (item.id === itemId) {
        const finalRemainingQty = item.totalStock - returnQty;
        console.log(`💾 Saving edit for ${item.productName}: ${item.totalStock} - ${returnQty} = ${finalRemainingQty}`);
        return {
          ...item,
          returnQty: returnQty,
          finalRemainingQty: finalRemainingQty
        };
      }
      return item;
    });
    
    setStockItems(updatedItems);
    setEditingId(null);
    setEditReturnQty('');
  };

  // Handle return quantity change
  const handleReturnQtyChange = (e) => {
    const value = e.target.value;
    // Allow empty or numeric values
    if (value === '' || /^\d+$/.test(value)) {
      setEditReturnQty(value);
    }
  };

  // Calculate final remaining in real-time for edit mode
  const calculateEditFinalRemaining = () => {
    if (editingId) {
      const item = stockItems.find(item => item.id === editingId);
      if (item) {
        const returnQty = parseInt(editReturnQty) || 0;
        const result = item.totalStock - returnQty;
        console.log(`🔢 Live calculation: ${item.totalStock} - ${returnQty} = ${result}`);
        return result;
      }
    }
    return 0;
  };

  // Handle save all returns
  const handleSaveAllReturns = async () => {
    try {
      setSaving(true);
      setError('');
      
      // Prepare data for API
      const returnsData = stockItems.map(item => {
        const finalRemaining = item.totalStock - item.returnQty;
        console.log(`📦 Preparing ${item.productName}: ${item.totalStock} - ${item.returnQty} = ${finalRemaining}`);
        return {
          id: item.id,
          returnQty: item.returnQty,
          finalRemaining: finalRemaining
        };
      });
      
      // Filter items that have return quantity > 0
      const itemsWithReturns = returnsData.filter(item => item.returnQty > 0);
      
      if (itemsWithReturns.length === 0) {
        alert('No return quantities entered. Please enter return quantities before saving.');
        return;
      }
      
      console.log('📦 Saving returns:', itemsWithReturns);
      
      // Call API to save returns
      const response = await api.put('/stocks/returns/bulk', {
        returns: itemsWithReturns,
        location: marketLocation,
        date: formatDateForAPI(selectedDate)
      });
      
      console.log('✅ Save response:', response.data);
      
      // Update original items
      setOriginalItems(JSON.parse(JSON.stringify(stockItems)));
      
      setSuccess(response.data.message);
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('❌ Error saving returns:', err);
      
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        setError(`Error: ${err.response.data.message || 'Failed to save returns'}`);
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError('No response from server. Please check your connection.');
      } else {
        console.error('Request setup error:', err.message);
        setError(`Error: ${err.message}`);
      }
      
    } finally {
      setSaving(false);
    }
  };

  // Format date as MM/dd/yyyy for display
  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    return JSON.stringify(stockItems) !== JSON.stringify(originalItems);
  };

  // Handle reset changes
  const handleResetChanges = () => {
    if (hasUnsavedChanges()) {
      const confirmReset = window.confirm('This will discard all unsaved return quantities. Continue?');
      if (confirmReset) {
        setStockItems(JSON.parse(JSON.stringify(originalItems)));
        setEditingId(null);
        setEditReturnQty('');
      }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="return-stock-container">
        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="h4" component="h1" gutterBottom className="page-title">
          Return Stock Management
        </Typography>

        {/* Market Details Section */}
        <Paper className="market-details-section" elevation={1}>
          <Typography variant="h6" gutterBottom className="section-title">
            Market Details
          </Typography>
          
          <div className="market-details-grid">
            <div className="market-detail-item">
              <Typography variant="subtitle2" className="detail-label">
                Date
              </Typography>
              <DatePicker
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                format="MM/dd/yyyy"
                className="date-picker"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    size: 'small'
                  }
                }}
              />
            </div>
            
            <div className="market-detail-item">
              <Typography variant="subtitle2" className="detail-label">
                Market Location
              </Typography>
              <FormControl fullWidth size="small">
                <Autocomplete
                  freeSolo
                  value={marketLocation}
                  onChange={(event, newValue) => setMarketLocation(newValue || 'Union Square, Manhattan')}
                  options={marketLocations}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select or type market location"
                    />
                  )}
                />
                <Typography variant="caption" className="field-hint">
                  Select date and location to view stock for the day
                </Typography>
              </FormControl>
            </div>
          </div>

          {/* Action Buttons */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchStockForDay}
              disabled={loading}
              size="small"
            >
              {loading ? 'LOADING...' : 'REFRESH STOCK'}
            </Button>
            
            {hasUnsavedChanges() && (
              <Button
                variant="outlined"
                color="warning"
                onClick={handleResetChanges}
                disabled={saving}
                size="small"
              >
                RESET CHANGES
              </Button>
            )}
            
            <Button
              variant="contained"
              color="success"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSaveAllReturns}
              disabled={saving || !hasUnsavedChanges()}
              size="small"
            >
              {saving ? 'SAVING...' : 'SAVE RETURNS'}
            </Button>
          </Box>
        </Paper>

        <Divider sx={{ my: 3 }} />

        {/* Stock Items List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : stockItems.length > 0 ? (
          <>
            <Paper className="stock-items-section" elevation={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" className="section-title">
                  Stock Items for {marketLocation} on {formatDateForDisplay(selectedDate)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Items: {stockItems.length}
                </Typography>
              </Box>
              
              <TableContainer>
                <Table className="stock-table">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Product Type</strong></TableCell>
                      <TableCell><strong>Product Name</strong></TableCell>
                      <TableCell><strong>Sub Category</strong></TableCell>
                      <TableCell><strong>Total Stocks</strong></TableCell>
                      <TableCell><strong>Return Qty</strong></TableCell>
                      <TableCell><strong>Final Remaining Qty</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stockItems.map((item) => (
                      <TableRow key={item.id} className={editingId === item.id ? 'editing-row' : ''}>
                        <TableCell>{item.productType}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.productSubCategory}</TableCell>
                        <TableCell>{item.totalStock}</TableCell>
                        
                        {/* Return Qty Cell - Editable */}
                        <TableCell>
                          {editingId === item.id ? (
                            <TextField
                              size="small"
                              type="number"
                              value={editReturnQty}
                              onChange={handleReturnQtyChange}
                              InputProps={{ 
                                inputProps: { 
                                  min: 0, 
                                  max: item.totalStock // Changed from remainingQty to totalStock
                                } 
                              }}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEdit(item.id);
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: item.returnQty > 0 ? 'bold' : 'normal',
                                color: item.returnQty > 0 ? '#d35400' : 'inherit'
                              }}
                            >
                              {item.returnQty}
                            </Typography>
                          )}
                        </TableCell>
                        
                        {/* Final Remaining Qty Cell */}
                        <TableCell>
                          {editingId === item.id ? (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: '#27ae60'
                              }}
                            >
                              {calculateEditFinalRemaining()}
                            </Typography>
                          ) : (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                color: item.finalRemainingQty < 0 ? '#e74c3c' : 
                                       item.finalRemainingQty < 5 ? '#f39c12' : '#27ae60'
                              }}
                            >
                              {item.finalRemainingQty}
                            </Typography>
                          )}
                        </TableCell>
                        
                        {/* Actions Cell */}
                        <TableCell>
                          {editingId === item.id ? (
  <div className="action-buttons">
    <IconButton
      size="small"
      onClick={() => handleSaveEdit(item.id)}
      sx={{ 
        color: 'success.main',
        '&:hover': {
          backgroundColor: 'success.light',
        }
      }}
      title="Save return quantity"
    >
      <SaveIcon fontSize="small" />
    </IconButton>
    <IconButton
      size="small"
      onClick={handleCancelEdit}
      sx={{ 
        color: 'error.main',
        '&:hover': {
          backgroundColor: 'error.light',
        }
      }}
      title="Cancel edit"
    >
      <CancelIcon fontSize="small" />
    </IconButton>
  </div>
) : (
  <IconButton
    size="small"
    onClick={() => handleEditClick(item)}
    sx={{ 
      color: 'primary.main',
      '&:hover': {
        backgroundColor: 'primary.light',
      }
    }}
    title="Edit return quantity"
    disabled={editingId !== null}
  >
    <EditIcon fontSize="small" />
  </IconButton>
)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        ) : (
          !loading && (
            <Paper className="no-items" elevation={1}>
              <Typography variant="body1" align="center" color="text.secondary">
                No stock items found for {marketLocation} on {formatDateForDisplay(selectedDate)}.
                <br />
                Please select a different date or location.
              </Typography>
            </Paper>
          )
        )}
      </div>
    </LocalizationProvider>
  );
};

export default ReturnStock;