import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Edit, Delete, Add, Search, Save } from '@mui/icons-material';
import axios from 'axios';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    productType: '',
    productCategory: '',
    productSubCategory: '',
    isNewProductCategory: false,
    isNewProductSubCategory: false
  });
  
  // Dropdown options from database
  const [productTypes, setProductTypes] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [productSubCategories, setProductSubCategories] = useState([]);
  
  // State for managing new entries
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductSubCategory, setNewProductSubCategory] = useState('');
  
  const [formErrors, setFormErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Fetch all necessary data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch product categories when product type changes
  useEffect(() => {
    if (formData.productType) {
      fetchProductCategories(formData.productType);
      // Only reset if we're not in editing mode
      if (!editingId) {
        setFormData(prev => ({
          ...prev,
          productCategory: '',
          productSubCategory: '',
          isNewProductCategory: false,
          isNewProductSubCategory: false
        }));
        setNewProductCategory('');
        setNewProductSubCategory('');
      }
    }
  }, [formData.productType]);

  // Fetch subcategories when product category changes AND product type is Greens
  useEffect(() => {
    if (formData.productCategory && formData.productType === 'Greens') {
      fetchProductSubCategories(formData.productCategory);
      // Only reset if we're not in editing mode
      if (!editingId) {
        setFormData(prev => ({
          ...prev,
          productSubCategory: '',
          isNewProductSubCategory: false
        }));
        setNewProductSubCategory('');
      }
    }
  }, [formData.productCategory, formData.productType]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchProductTypes()
      ]);
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/product-types');
      setProductTypes(response.data);
    } catch (err) {
      console.error('Error fetching product types:', err);
    }
  };

  const fetchProductCategories = async (productType) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/product-categories?type=${productType}`);
      setProductCategories(response.data);
    } catch (err) {
      console.error('Error fetching product categories:', err);
    }
  };

  const fetchProductSubCategories = async (productCategory) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/product-subcategories?category=${productCategory}`);
      setProductSubCategories(response.data);
    } catch (err) {
      console.error('Error fetching product subcategories:', err);
    }
  };

  const handleTypeChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      productType: value,
      productCategory: editingId ? formData.productCategory : '',
      productSubCategory: editingId ? formData.productSubCategory : '',
      isNewProductCategory: false,
      isNewProductSubCategory: false
    });
    setNewProductCategory('');
    setNewProductSubCategory('');
    
    if (formErrors.productType) {
      setFormErrors(prev => ({ ...prev, productType: '' }));
    }
  };

  const handleCategoryChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      productCategory: value,
      productSubCategory: editingId && formData.productSubCategory ? formData.productSubCategory : '',
      isNewProductCategory: value === 'new',
      isNewProductSubCategory: false
    });
    
    if (value === 'new') {
      setNewProductCategory('');
    }
    
    if (formErrors.productCategory) {
      setFormErrors(prev => ({ ...prev, productCategory: '' }));
    }
  };

  const handleSubCategoryChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      productSubCategory: value,
      isNewProductSubCategory: value === 'new'
    });
    
    if (value === 'new') {
      setNewProductSubCategory('');
    }
    
    if (formErrors.productSubCategory) {
      setFormErrors(prev => ({ ...prev, productSubCategory: '' }));
    }
  };

  const handleNewCategoryChange = (event) => {
    setNewProductCategory(event.target.value);
    if (event.target.value) {
      setFormData(prev => ({
        ...prev,
        productCategory: event.target.value
      }));
    }
  };

  const handleNewSubCategoryChange = (event) => {
    setNewProductSubCategory(event.target.value);
    if (event.target.value) {
      setFormData(prev => ({
        ...prev,
        productSubCategory: event.target.value
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.productType) errors.productType = 'Product Type is required';
    if (!formData.productCategory) errors.productCategory = 'Product Category is required';
    
    // Only validate subcategory if product type is Greens
    if (formData.productType === 'Greens' && !formData.productSubCategory) {
      errors.productSubCategory = 'Product Sub Category is required for Greens';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');
      
      const productData = {
        productType: formData.productType,
        productCategory: formData.productCategory,
        productSubCategory: formData.productType === 'Greens' ? formData.productSubCategory : null
      };
      
      // First, check if we need to add new category to database
      if (formData.isNewProductCategory && newProductCategory) {
        await axios.post('http://localhost:5000/api/product-categories', {
          productType: formData.productType,
          name: newProductCategory
        });
      }
      
      // Check if we need to add new subcategory to database
      if (formData.isNewProductSubCategory && newProductSubCategory && formData.productType === 'Greens') {
        await axios.post('http://localhost:5000/api/product-subcategories', {
          productCategory: formData.productCategory,
          name: newProductSubCategory
        });
      }
      
      // Now save the product
      if (editingId) {
        await axios.put(`http://localhost:5000/api/products/${editingId}`, productData);
        setSuccess('Product updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/products', productData);
        setSuccess('Product added successfully!');
      }
      
      resetForm();
      await fetchAllData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to save product. Please try again.';
      setError(errorMessage);
      console.error('Error saving product:', err);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: handleEdit function
  const handleEdit = async (product) => {
    try {
      // First, set the form data with the product values
      setFormData({
        productType: product.productType || '',
        productCategory: product.productCategory || '',
        productSubCategory: product.productSubCategory || '',
        isNewProductCategory: false,
        isNewProductSubCategory: false
      });
      
      setEditingId(product._id);
      setTabValue(0);
      
      // Fetch categories for the product type
      if (product.productType) {
        await fetchProductCategories(product.productType);
      }
      
      // Fetch subcategories if product type is Greens
      if (product.productType === 'Greens' && product.productCategory) {
        await fetchProductSubCategories(product.productCategory);
      }
      
      setSuccess('Product loaded for editing');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to load product for editing. Please try again.');
      console.error('Error in handleEdit:', err);
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/products/${productToDelete._id}`);
      setSuccess('Product deleted successfully!');
      await fetchAllData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete product. Please try again.');
      console.error('Error deleting product:', err);
    } finally {
      setLoading(false);
      setDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog(false);
    setProductToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      productType: '',
      productCategory: '',
      productSubCategory: '',
      isNewProductCategory: false,
      isNewProductSubCategory: false
    });
    setNewProductCategory('');
    setNewProductSubCategory('');
    setFormErrors({});
    setEditingId(null);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Check if subcategory field should be shown
  const showSubCategoryField = formData.productType === 'Greens';

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4, fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif" }}>
      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}

      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: '#2c3e50', fontWeight: 600 }}>
        {editingId ? 'Update Product' : 'Product Management'}
      </Typography>

      {/* Tabs for Add/View */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Add/Edit Product" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="View Products" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
      </Box>

      {tabValue === 0 ? (
        /* Product Form */
        <Paper sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #e0e0e0'
        }}>
          <Typography variant="h6" gutterBottom sx={{ 
            mb: 3, 
            color: '#2c3e50',
            fontWeight: 600,
            fontSize: '1.5rem',
            borderBottom: '2px solid #3498db',
            paddingBottom: '10px'
          }}>
            {editingId ? 'Update Existing Product' : 'Add New Product'}
          </Typography>
          
          <form onSubmit={handleSubmit}>
            {/* Product Type */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth error={!!formErrors.productType}>
                <InputLabel 
                  id="product-type-label"
                  sx={{ 
                    fontWeight: 600,
                    color: '#34495e',
                    '&.Mui-focused': {
                      color: '#3498db'
                    }
                  }}
                >
                  Product Type *
                </InputLabel>
                <Select
                  labelId="product-type-label"
                  id="product-type"
                  value={formData.productType}
                  label="Product Type *"
                  onChange={handleTypeChange}
                  sx={{
                    '& .MuiSelect-select': {
                      padding: '14px 16px',
                      fontSize: '15px',
                      borderRadius: '8px'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: '2px solid #ddd',
                      borderRadius: '8px'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3498db'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3498db',
                      borderWidth: '2px',
                      boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.15)'
                    }
                  }}
                >
                  {productTypes.map((type) => (
                    <MenuItem key={type._id || type.id || `type-${type.name}`} value={type.name}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.productType && (
                  <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1, ml: 1 }}>
                    {formErrors.productType}
                  </Typography>
                )}
              </FormControl>
            </Box>

            {/* Product Category */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth error={!!formErrors.productCategory} 
                disabled={!formData.productType && !editingId}>
                <InputLabel 
                  id="product-category-label"
                  sx={{ 
                    fontWeight: 600,
                    color: '#34495e',
                    '&.Mui-focused': {
                      color: '#3498db'
                    }
                  }}
                >
                  Product Category *
                </InputLabel>
                <Select
                  labelId="product-category-label"
                  id="product-category"
                  value={formData.productCategory}
                  label="Product Category *"
                  onChange={handleCategoryChange}
                  sx={{
                    '& .MuiSelect-select': {
                      padding: '14px 16px',
                      fontSize: '15px',
                      borderRadius: '8px'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: '2px solid #ddd',
                      borderRadius: '8px'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3498db'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3498db',
                      borderWidth: '2px',
                      boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.15)'
                    },
                    '&.Mui-disabled': {
                      backgroundColor: '#f9f9f9'
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>Select a category</em>
                  </MenuItem>
                  {productCategories.map((category) => (
                    <MenuItem key={category._id || category.id || `cat-${category.name}`} value={category.name}>
                      {category.name}
                    </MenuItem>
                  ))}
                  <MenuItem value="new" sx={{ color: '#3498db', fontWeight: 600 }}>
                    + Add New Category
                  </MenuItem>
                </Select>
                {formErrors.productCategory && (
                  <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1, ml: 1 }}>
                    {formErrors.productCategory}
                  </Typography>
                )}
              </FormControl>

              {/* New Category Input */}
              {formData.isNewProductCategory && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="New Category Name *"
                    value={newProductCategory}
                    onChange={handleNewCategoryChange}
                    placeholder="Enter new category name"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px'
                      }
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Product Sub Category (Only for Greens) */}
            {showSubCategoryField && (
              <Box sx={{ mb: 3 }}>
                <FormControl fullWidth error={!!formErrors.productSubCategory} 
                  disabled={!formData.productCategory && !editingId}>
                  <InputLabel 
                    id="product-subcategory-label"
                    sx={{ 
                      fontWeight: 600,
                      color: '#34495e',
                      '&.Mui-focused': {
                        color: '#3498db'
                      }
                    }}
                  >
                    Product Sub Category *
                  </InputLabel>
                  <Select
                    labelId="product-subcategory-label"
                    id="product-subcategory"
                    value={formData.productSubCategory}
                    label="Product Sub Category *"
                    onChange={handleSubCategoryChange}
                    sx={{
                      '& .MuiSelect-select': {
                        padding: '14px 16px',
                        fontSize: '15px',
                        borderRadius: '8px'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: '2px solid #ddd',
                        borderRadius: '8px'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3498db'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3498db',
                        borderWidth: '2px',
                        boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.15)'
                      },
                      '&.Mui-disabled': {
                        backgroundColor: '#f9f9f9'
                      }
                    }}
                  >
                    <MenuItem value="">
                      <em>Select a subcategory</em>
                    </MenuItem>
                    {productSubCategories.map((subcategory) => (
                      <MenuItem key={subcategory._id || subcategory.id || `subcat-${subcategory.name}`} value={subcategory.name}>
                        {subcategory.name}
                      </MenuItem>
                    ))}
                    <MenuItem value="new" sx={{ color: '#3498db', fontWeight: 600 }}>
                      + Add New Sub Category
                    </MenuItem>
                  </Select>
                  {formErrors.productSubCategory && (
                    <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1, ml: 1 }}>
                      {formErrors.productSubCategory}
                    </Typography>
                  )}
                </FormControl>

                {/* New Sub Category Input */}
                {formData.isNewProductSubCategory && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      label="New Sub Category Name *"
                      value={newProductSubCategory}
                      onChange={handleNewSubCategoryChange}
                      placeholder="Enter new subcategory name"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px'
                        }
                      }}
                    />
                  </Box>
                )}
              </Box>
            )}

            {/* Current Selections Display */}
            <Box sx={{ mb: 3 }}>
              <Paper variant="outlined" sx={{ 
                p: 2, 
                bgcolor: 'grey.50',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                  Current Selections:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    label={`Type: ${formData.productType || 'Not selected'}`} 
                    color={formData.productType ? "primary" : "default"}
                    size="small"
                    sx={{ 
                      fontWeight: 500,
                      borderRadius: '6px'
                    }}
                  />
                  <Chip 
                    label={`Category: ${formData.productCategory || 'Not selected'}`} 
                    color={formData.productCategory ? "primary" : "default"}
                    size="small"
                    sx={{ 
                      fontWeight: 500,
                      borderRadius: '6px'
                    }}
                  />
                  {showSubCategoryField && (
                    <Chip 
                      label={`Sub-category: ${formData.productSubCategory || 'Not selected'}`} 
                      color={formData.productSubCategory ? "primary" : "default"}
                      size="small"
                      sx={{ 
                        fontWeight: 500,
                        borderRadius: '6px'
                      }}
                    />
                  )}
                </Box>
              </Paper>
            </Box>

            {/* Form Actions */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                sx={{
                  background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '15px',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #27ae60 0%, #219653 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(46, 204, 113, 0.4)'
                  },
                  '&:disabled': {
                    background: '#95a5a6'
                  }
                }}
              >
                {editingId ? 'Update Product' : 'Save Product'}
              </Button>
              {editingId && (
                <Button
                  variant="outlined"
                  onClick={resetForm}
                  disabled={loading}
                  sx={{
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '15px',
                    borderColor: '#bdc3c7',
                    color: '#7f8c8d',
                    '&:hover': {
                      borderColor: '#95a5a6',
                      backgroundColor: 'rgba(189, 195, 199, 0.08)'
                    }
                  }}
                >
                  Cancel Edit
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={() => setTabValue(1)}
                sx={{
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '15px',
                  borderColor: '#3498db',
                  color: '#3498db',
                  '&:hover': {
                    backgroundColor: 'rgba(52, 152, 219, 0.08)',
                    borderColor: '#2980b9'
                  }
                }}
              >
                View Products
              </Button>
              <Button
                variant="outlined"
                onClick={fetchAllData}
                disabled={loading}
                startIcon={<Search />}
                sx={{
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '15px',
                  borderColor: '#9b59b6',
                  color: '#9b59b6',
                  '&:hover': {
                    backgroundColor: 'rgba(155, 89, 182, 0.08)',
                    borderColor: '#8e44ad'
                  }
                }}
              >
                Refresh Data
              </Button>
            </Box>
          </form>
          
          {/* Info Box */}
          <Box sx={{ 
            mt: 3, 
            p: 2, 
            bgcolor: 'info.light', 
            borderRadius: '8px',
            borderLeft: '4px solid #3498db'
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#2c3e50' }}>
              How to add products:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1, color: '#34495e' }}>
                Select Product Type (Greens or Kitchen)
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1, color: '#34495e' }}>
                Select Product Category from dropdown or choose "Add New Category"
              </Typography>
              {showSubCategoryField && (
                <Typography component="li" variant="body2" sx={{ mb: 1, color: '#34495e' }}>
                  For Greens: Select Sub Category or choose "Add New Sub Category"
                </Typography>
              )}
              <Typography component="li" variant="body2" sx={{ color: '#34495e' }}>
                Click "Save Product" when all required fields are filled
              </Typography>
            </Box>
          </Box>
        </Paper>
      ) : (
        /* Products List */
        <Box>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3, 
            flexWrap: 'wrap', 
            gap: 2 
          }}>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#2c3e50' }}>
              Existing Products ({products.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  resetForm();
                  setTabValue(0);
                }}
                sx={{
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '14px',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2980b9 0%, #2573a7 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(52, 152, 219, 0.4)'
                  }
                }}
              >
                Add New Product
              </Button>
              <Button
                variant="outlined"
                onClick={fetchAllData}
                disabled={loading}
                startIcon={<Search />}
                sx={{
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '14px',
                  borderColor: '#9b59b6',
                  color: '#9b59b6',
                  '&:hover': {
                    backgroundColor: 'rgba(155, 89, 182, 0.08)',
                    borderColor: '#8e44ad'
                  }
                }}
              >
                Refresh List
              </Button>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : products.length === 0 ? (
            <Paper sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: '8px',
              bgcolor: '#f8f9fa',
              border: '2px dashed #ddd'
            }}>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '16px' }}>
                No products found. Add your first product!
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ 
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              border: '1px solid #e0e0e0'
            }}>
              <Table>
                <TableHead sx={{ 
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)'
                }}>
                  <TableRow>
                    <TableCell sx={{ 
                      color: 'white', 
                      fontWeight: 600,
                      fontSize: '14px',
                      borderBottom: 'none'
                    }}>
                      Product Type
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'white', 
                      fontWeight: 600,
                      fontSize: '14px',
                      borderBottom: 'none'
                    }}>
                      Product Category
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'white', 
                      fontWeight: 600,
                      fontSize: '14px',
                      borderBottom: 'none'
                    }}>
                      Sub Category
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'white', 
                      fontWeight: 600,
                      fontSize: '14px',
                      borderBottom: 'none'
                    }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id} hover sx={{ '&:hover': { backgroundColor: '#f8f9fa' } }}>
                      <TableCell>
                        <Chip 
                          label={product.productType} 
                          color={product.productType === 'Greens' ? "success" : "warning"}
                          size="small"
                          sx={{ 
                            fontWeight: 500,
                            borderRadius: '6px'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#34495e', fontSize: '14px' }}>
                        {product.productCategory}
                      </TableCell>
                      <TableCell sx={{ color: '#34495e', fontSize: '14px' }}>
                        {product.productSubCategory || (
                          <Typography variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => handleEdit(product)}
                            disabled={loading}
                            sx={{
                              borderColor: '#3498db',
                              color: '#3498db',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontWeight: 600,
                              textTransform: 'none',
                              fontSize: '13px',
                              '&:hover': {
                                backgroundColor: 'rgba(52, 152, 219, 0.1)'
                              }
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Delete />}
                            onClick={() => handleDeleteClick(product)}
                            disabled={loading}
                            sx={{
                              borderColor: '#e74c3c',
                              color: '#e74c3c',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontWeight: 600,
                              textTransform: 'none',
                              fontSize: '13px',
                              '&:hover': {
                                backgroundColor: 'rgba(231, 76, 60, 0.1)'
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog} 
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            padding: '8px'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#2c3e50', 
          fontWeight: 600,
          borderBottom: '1px solid #eee',
          padding: '20px 24px 16px 24px'
        }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent sx={{ padding: '20px 24px' }}>
          <Typography sx={{ color: '#34495e' }}>
            Are you sure you want to delete the product: 
            <strong> {productToDelete?.productCategory} - {productToDelete?.productSubCategory || 'N/A'}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          padding: '16px 24px 20px 24px',
          borderTop: '1px solid #eee'
        }}>
          <Button 
            onClick={handleDeleteCancel} 
            disabled={loading}
            sx={{
              borderRadius: '8px',
              padding: '8px 20px',
              fontWeight: 600,
              textTransform: 'none',
              borderColor: '#bdc3c7',
              color: '#7f8c8d',
              '&:hover': {
                borderColor: '#95a5a6',
                backgroundColor: 'rgba(189, 195, 199, 0.08)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained"
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
              color: 'white',
              borderRadius: '8px',
              padding: '8px 20px',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #c0392b 0%, #a93226 100%)'
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProductManagement;