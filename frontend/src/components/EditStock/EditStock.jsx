import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { stockAPI } from '../../services/api';

const EditStock = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: '',
    totalStock: '',
    stockSold: '',
    stockReturned: '',
    location: 'New York',
    notes: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStock();
  }, [id]);

  const fetchStock = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use the new getById API method
      const res = await stockAPI.getById(id);
      
      if (res.data) {
        // Format date for input field (YYYY-MM-DD)
        const stockDate = new Date(res.data.date);
        const formattedDate = stockDate.toISOString().split('T')[0];
        
        setFormData({
          date: formattedDate,
          totalStock: res.data.totalStock,
          stockSold: res.data.stockSold,
          stockReturned: res.data.stockReturned || 0,
          location: res.data.location || 'New York',
          notes: res.data.notes || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch stock:', err);
      setError(err.response?.data?.message || 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.date) {
      setError('Date is required');
      setSaving(false);
      return;
    }

    if (!formData.totalStock || formData.totalStock <= 0) {
      setError('Total stock must be greater than 0');
      setSaving(false);
      return;
    }

    if (Number(formData.stockSold) < 0 || Number(formData.stockReturned) < 0) {
      setError('Stock sold and returned cannot be negative');
      setSaving(false);
      return;
    }

    const total = Number(formData.totalStock);
    const sold = Number(formData.stockSold) || 0;
    const returned = Number(formData.stockReturned) || 0;
    
    if (sold + returned > total) {
      setError('Stock sold and returned cannot exceed total stock');
      setSaving(false);
      return;
    }

    const stockData = {
      date: formData.date,
      totalStock: total,
      stockSold: sold,
      stockReturned: returned,
      location: formData.location,
      notes: formData.notes
    };

    try {
      // Use the update API method
      await stockAPI.update(id, stockData);
      
      setSuccess('Stock updated successfully!');
      
      // Wait 1.5 seconds then redirect
      setTimeout(() => {
        navigate('/stocks');
      }, 1500);
      
    } catch (err) {
      console.error('Failed to update stock:', err);
      setError(err.response?.data?.message || 'Failed to update stock. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/stocks')}
          sx={{ mr: 2 }}
        >
          Back to Stocks
        </Button>
        <Typography variant="h4">
          Edit Stock Entry (ID: {id})
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Date Field */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date *"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Location Field */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Location *</InputLabel>
                <Select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  label="Location *"
                >
                  <MenuItem value="New York">New York</MenuItem>
                  <MenuItem value="New Jersey">New Jersey</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Total Stock */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Total Stock *"
                name="totalStock"
                type="number"
                value={formData.totalStock}
                onChange={handleChange}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>

            {/* Stock Sold */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Stock Sold"
                name="stockSold"
                type="number"
                value={formData.stockSold}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Stock Returned */}
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Stock Returned"
                name="stockReturned"
                type="number"
                value={formData.stockReturned}
                onChange={handleChange}
                inputProps={{ min: 0 }}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Any additional notes about this stock entry"
              />
            </Grid>

            {/* Available Stock (Read-only) */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="body1">
                  <strong>Available Stock:</strong>{' '}
                  {formData.totalStock - (Number(formData.stockSold) || 0) - (Number(formData.stockReturned) || 0)}
                </Typography>
              </Paper>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate('/stocks')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default EditStock;