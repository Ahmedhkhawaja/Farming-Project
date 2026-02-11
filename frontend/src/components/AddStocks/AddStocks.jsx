// AddStock.jsx - Updated with simplified Save button
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
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import UmbrellaIcon from '@mui/icons-material/Umbrella';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import api from '../../services/api';
import '../AddStock.css';

const AddStock = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [marketLocation, setMarketLocation] = useState('Union Square (Monday) Manhattan');
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // New Product Dialog State
  const [newProductDialog, setNewProductDialog] = useState(false);
  const [newProductData, setNewProductData] = useState({
    productType: '',
    productCategory: '',
    unit: 'pieces'
  });

  // Weather state - updated to include high/low temperatures
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    productType: '',
    productCategory: '',
    totalStock: '',
    unit: 'pieces'
  });

  // Product options from API
  const [productTypes, setProductTypes] = useState([]);
  const [productCategories, setProductCategories] = useState({});

  // Units for selection
  const units = [
    { value: 'pieces', label: 'Pieces' },
    { value: 'Cases', label: 'Cases' },
    { value: 'Bunches', label: 'Bunches' },
    { value: 'bags', label: 'Bags' },
    { value: 'jar', label: 'Jar' },
    { value: 'pack', label: 'Pack' },
    { value: 'bowl', label: 'Bowl' },
    { value: 'bottle', label: 'Bottle' }
  ];

  // Default units based on product type - UPDATED: Greens now defaults to 'Cases'
  const getDefaultUnitForType = (type) => {
    if (type === 'Greens') return 'Cases'; // Changed from 'Bunches' to 'Cases'
    if (type === 'Kitchen') return 'pieces';
    return 'pieces';
  };

  // Market locations with coordinates for weather API
  const marketLocations = [
    { name: 'Union Square (Monday) Manhattan', lat: 40.7359, lon: -73.9911 },
    { name: 'Union Square (Wednesday) Manhattan', lat: 40.7359, lon: -73.9911 },
    { name: 'Columbia University (Thursday) Upper west side Manhattan', lat: 40.8075, lon: -73.9626 },
    { name: 'Union Square (Saturday) Manhattan', lat: 40.7359, lon: -73.9911 },
    { name: 'Tribecca (Saturday) Lower Manhattan', lat: 40.7181, lon: -74.0076 },
    { name: 'Larchmont (Saturday) Westchester NY', lat: 40.9279, lon: -73.7518 },
    { name: 'Carrol Gardens (Sunday) Brooklyn', lat: 40.6795, lon: -73.9994 },
    { name: 'Jackson Heights (Sunday) Queens', lat: 40.7557, lon: -73.8846 }
  ];

  // Default product template for new locations/dates - UPDATED: All Greens products now have unit as 'Cases'
  const defaultProductsTemplate = [
    { productType: 'Greens', productCategory: 'Lettuce', unit: 'Cases' },
    { productType: 'Greens', productCategory: 'Baby Green', unit: 'Cases' },
    { productType: 'Greens', productCategory: 'Arugula', unit: 'Cases' },
    { productType: 'Greens', productCategory: 'Frisee', unit: 'Cases' },
    { productType: 'Greens', productCategory: 'Broccoli Raab', unit: 'Cases' },
    { productType: 'Greens', productCategory: 'Spinach', unit: 'Cases' },
    { productType: 'Greens', productCategory: 'Bokchoy', unit: 'Cases' },
    { productType: 'Greens', productCategory: 'Bunches', unit: 'Cases' },
    { productType: 'Kitchen', productCategory: 'Soup', unit: 'pieces' },
    { productType: 'Kitchen', productCategory: 'Juice', unit: 'pieces' },
    { productType: 'Kitchen', productCategory: 'Small Kimchi', unit: 'pieces' },
    { productType: 'Kitchen', productCategory: 'Large Kimchi', unit: 'pieces' },
    { productType: 'Kitchen', productCategory: 'Dumpling', unit: 'pieces' },
    { productType: 'Kitchen', productCategory: 'Chips', unit: 'pieces' },
    { productType: 'Kitchen', productCategory: 'Moo Radish', unit: 'pieces' },
    { productType: 'Kitchen', productCategory: 'Cheese Pumpkin', unit: 'pieces' },
    { productType: 'Kitchen', productCategory: 'Burger', unit: 'pieces' }
  ];

  // Weather API key - use env var in production (set REACT_APP_WEATHER_API_KEY in Vercel)
  const WEATHER_API_KEY = process.env.REACT_APP_WEATHER_API_KEY || '11429cda8c44fbbbcfcbcddf66aeba13';

  // Load saved stocks when date or location changes
  useEffect(() => {
    if (selectedDate && marketLocation) {
      fetchSavedStocks();
    }
  }, [selectedDate, marketLocation]);

  // Fetch weather when date or location changes
  useEffect(() => {
    if (marketLocation && selectedDate) {
      fetchWeatherForecast();
    }
  }, [marketLocation, selectedDate]);

  // Fetch all product data on mount
  useEffect(() => {
    fetchProductTypes();
  }, []);

  // Fetch product types
  const fetchProductTypes = async () => {
    try {
      const response = await api.get('/product-types');
      const types = response.data.map(type => type.name || type);
      setProductTypes(types);
      
      // Also fetch categories for each type
      const categoriesObj = {};
      for (const type of types) {
        try {
          const catResponse = await api.get(`/product-categories?productType=${type}`);
          categoriesObj[type] = catResponse.data.map(cat => cat.name || cat);
        } catch (catErr) {
          console.error(`Error fetching categories for ${type}:`, catErr);
          // Use default categories if API fails
          if (type === 'Greens') {
            categoriesObj[type] = ['Lettuce', 'Baby Green', 'Arugula', 'Frisee', 'Broccoli Raab', 'Spinach', 'Bokchoy', 'Bunches'];
          } else if (type === 'Kitchen') {
            categoriesObj[type] = ['Soup', 'Juice', 'Small Kimchi', 'Large Kimchi', 'Dumpling', 'Chips', 'Moo Radish', 'Cheese Pumpkin', 'Burger'];
          } else {
            categoriesObj[type] = [];
          }
        }
      }
      setProductCategories(categoriesObj);
    } catch (err) {
      console.error('Error fetching product types:', err);
      // Fallback to default types and categories
      setProductTypes(['Greens', 'Kitchen']);
      setProductCategories({
        'Greens': ['Lettuce', 'Baby Green', 'Arugula', 'Frisee', 'Broccoli Raab', 'Spinach', 'Bokchoy', 'Bunches'],
        'Kitchen': ['Soup', 'Juice', 'Small Kimchi', 'Large Kimchi', 'Dumpling', 'Chips', 'Moo Radish', 'Cheese Pumpkin', 'Burger']
      });
    }
  };

  // Get simplified weather condition for storage
  const getSimplifiedWeatherCondition = (condition) => {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) return 'Sunny';
    if (conditionLower.includes('cloud')) return 'Cloudy';
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) return 'Rainy';
    if (conditionLower.includes('snow') || conditionLower.includes('sleet')) return 'Snowy';
    if (conditionLower.includes('thunder')) return 'Thunderstorm';
    if (conditionLower.includes('mist') || conditionLower.includes('fog')) return 'Foggy';
    
    return condition.split(' ')[0] || 'Unknown';
  };

  const fetchWeatherForecast = async () => {
    try {
      setWeatherLoading(true);
      setWeatherError('');
      
      const selectedLocation = marketLocations.find(loc => loc.name === marketLocation);
      if (!selectedLocation) {
        setWeatherError('Location coordinates not found');
        return;
      }

      const { lat, lon } = selectedLocation;
      // Using 5-day/3-hour forecast API to get daily high/low temperatures
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Weather API error ${response.status}: ${errorData.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      // Get today's date and the selected date
      const today = new Date();
      const selectedDay = new Date(selectedDate);
      
      // Format dates to YYYY-MM-DD for comparison
      const formatDateStr = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const selectedDateStr = formatDateStr(selectedDay);
      const todayDateStr = formatDateStr(today);
      
      // Filter forecasts for the selected date
      const dailyForecasts = data.list.filter(item => {
        const forecastDate = new Date(item.dt * 1000);
        return formatDateStr(forecastDate) === selectedDateStr;
      });
      
      if (dailyForecasts.length === 0) {
        // If no forecast for selected date (beyond 5 days), use the first available forecast
        setWeatherError('Weather forecast not available for this date (max 5 days ahead)');
        
        // Try to get current weather as fallback
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
        const currentResponse = await fetch(currentWeatherUrl);
        
        if (!currentResponse.ok) {
          throw new Error('Cannot fetch weather data');
        }
        
        const currentData = await currentResponse.json();
        
        const weatherData = {
          temperature: Math.round(currentData.main.temp),
          feelsLike: Math.round(currentData.main.feels_like),
          highTemp: Math.round(currentData.main.temp_max),
          lowTemp: Math.round(currentData.main.temp_min),
          humidity: currentData.main.humidity,
          description: currentData.weather[0].description,
          main: currentData.weather[0].main,
          condition: getSimplifiedWeatherCondition(currentData.weather[0].main),
          icon: `https://openweathermap.org/img/wn/${currentData.weather[0].icon}.png`,
          windSpeed: currentData.wind.speed,
          clouds: currentData.clouds.all,
          rain: currentData.rain ? currentData.rain['1h'] || 0 : 0,
          snow: currentData.snow ? currentData.snow['1h'] || 0 : 0,
          pressure: currentData.main.pressure,
          isForecast: false
        };
        
        setWeather(weatherData);
        return;
      }
      
      // Calculate high and low temperatures for the day
      const temperatures = dailyForecasts.map(item => item.main.temp);
      const highTemp = Math.round(Math.max(...temperatures));
      const lowTemp = Math.round(Math.min(...temperatures));
      
      // Find the forecast for midday (12:00) or use the first forecast
      const middayForecast = dailyForecasts.find(item => {
        const hour = new Date(item.dt * 1000).getHours();
        return hour >= 11 && hour <= 14;
      }) || dailyForecasts[0];
      
      // Get the most common weather condition for the day
      const conditions = dailyForecasts.map(item => item.weather[0].main);
      const conditionCounts = {};
      conditions.forEach(cond => {
        conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
      });
      
      let mostCommonCondition = conditions[0];
      let maxCount = 0;
      Object.entries(conditionCounts).forEach(([cond, count]) => {
        if (count > maxCount) {
          mostCommonCondition = cond;
          maxCount = count;
        }
      });
      
      const weatherData = {
        temperature: Math.round(middayForecast.main.temp),
        feelsLike: Math.round(middayForecast.main.feels_like),
        highTemp: highTemp,
        lowTemp: lowTemp,
        humidity: middayForecast.main.humidity,
        description: middayForecast.weather[0].description,
        main: mostCommonCondition,
        condition: getSimplifiedWeatherCondition(mostCommonCondition),
        icon: `https://openweathermap.org/img/wn/${middayForecast.weather[0].icon}.png`,
        windSpeed: middayForecast.wind.speed,
        clouds: middayForecast.clouds.all,
        rain: middayForecast.rain ? middayForecast.rain['3h'] || 0 : 0,
        snow: middayForecast.snow ? middayForecast.snow['3h'] || 0 : 0,
        pressure: middayForecast.main.pressure,
        isForecast: true
      };
      
      setWeather(weatherData);
      
    } catch (err) {
      console.error('Error fetching weather:', err);
      setWeatherError(`Weather data unavailable: ${err.message}`);
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  const formatDateForAPI = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get weather icon based on condition
  const getWeatherIcon = (condition) => {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) 
      return <WbSunnyIcon sx={{ color: '#FFD700' }} />;
    if (conditionLower.includes('cloud')) 
      return <CloudIcon sx={{ color: '#A9A9A9' }} />;
    if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) 
      return <UmbrellaIcon sx={{ color: '#4169E1' }} />;
    if (conditionLower.includes('snow') || conditionLower.includes('sleet')) 
      return <AcUnitIcon sx={{ color: '#87CEEB' }} />;
    if (conditionLower.includes('thunder')) 
      return <ThunderstormIcon sx={{ color: '#4B0082' }} />;
    if (conditionLower.includes('mist') || conditionLower.includes('fog'))
      return <CloudIcon sx={{ color: '#B0C4DE' }} />;
    
    return <WbSunnyIcon sx={{ color: '#FFD700' }} />;
  };

  // Get weather impact message
  const getWeatherImpact = (weather) => {
    if (!weather) return '';
    
    const { main, rain, snow, temperature, highTemp, lowTemp } = weather;
    
    if (main.toLowerCase().includes('rain') || main.toLowerCase().includes('snow')) {
      return '⛈️ Expected Low Sales: Rainy/Snowy days typically see 40-60% lower sales';
    }
    
    if (main.toLowerCase().includes('cloud')) {
      return '☁️ Moderate Sales: Cloudy days might see 20-30% lower sales';
    }
    
    if (lowTemp < 0) {
      return '❄️ Very Low Sales: Freezing temperatures significantly reduce customer turnout';
    }
    
    if (lowTemp < 5) {
      return '❄️ Low Sales: Very cold weather reduces customer turnout';
    }
    
    if (highTemp > 35) {
      return '🔥 Low Sales: Extreme heat discourages shopping';
    }
    
    if (highTemp > 30) {
      return '🔥 Moderate Sales: Hot weather may reduce but not eliminate sales';
    }
    
    if (temperature >= 15 && temperature <= 25 && main.toLowerCase().includes('clear')) {
      return '☀️ High Sales Expected: Perfect weather conditions for maximum sales';
    }
    
    return '🌤️ Good Sales Expected: Decent weather conditions for sales';
  };

  // Handle form field changes
  const handleTypeChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      productType: value,
      productCategory: '', // Reset category when type changes
      unit: getDefaultUnitForType(value) // Auto-set unit based on type
    });
  };

  const handleCategoryChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      productCategory: value
    });
  };

  // Handle form field changes for new product dialog
  const handleNewProductChange = (field) => (event) => {
    const value = event.target.value;
    setNewProductData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-set unit based on product type
      if (field === 'productType' && value) {
        updated.unit = getDefaultUnitForType(value);
      }
      
      return updated;
    });
  };

  // Handle market location change
  const handleMarketLocationChange = (value) => {
    setMarketLocation(value);
  };

  const handleAddToList = () => {
    if (!formData.productType || !formData.productCategory || !formData.totalStock || !formData.unit) {
      alert('Please fill in all required fields');
      return;
    }

    const newItem = {
      id: `new-${Date.now()}`,
      productType: formData.productType,
      productCategory: formData.productCategory,
      totalStock: parseFloat(formData.totalStock) || 0,
      unit: formData.unit,
      returnQty: 0,
      soldQty: 0,
      remainingQty: parseFloat(formData.totalStock) || 0
    };

    // Add new item to the state
    setStockItems(prev => [newItem, ...prev]);
    setFormData({
      productType: '',
      productCategory: '',
      totalStock: '',
      unit: 'pieces'
    });
    
    setSuccess('Product added to listing successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAddNewProduct = () => {
    if (!newProductData.productType || !newProductData.productCategory || !newProductData.unit) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if product already exists in listing
    const exists = stockItems.some(item => 
      item.productType === newProductData.productType && 
      item.productCategory === newProductData.productCategory
    );

    if (exists) {
      alert('This product is already in the listing');
      return;
    }

    const newItem = {
      id: `new-${Date.now()}`,
      productType: newProductData.productType,
      productCategory: newProductData.productCategory,
      totalStock: 0, // Start with 0 stock
      unit: newProductData.unit,
      returnQty: 0,
      soldQty: 0,
      remainingQty: 0
    };

    // Add new item to the state
    setStockItems(prev => [...prev, newItem]);
    
    // Reset form and close dialog
    setNewProductData({
      productType: '',
      productCategory: '',
      unit: 'pieces'
    });
    setNewProductDialog(false);
    
    setSuccess('Product added to listing successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteItem = (index) => {
    const updatedItems = stockItems.filter((_, i) => i !== index);
    setStockItems(updatedItems);
  };

  // Updated handleSave function - removed isDayEnd parameter
  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");

      if (stockItems.length === 0) {
        alert("No items to save!");
        return;
      }

      // Prepare weather data with high/low temperatures
      let weatherCondition = "Unknown";
      let weatherHighTemp = null;
      let weatherLowTemp = null;
      let weatherDescription = "";

      if (weather) {
        weatherCondition = weather.condition || getSimplifiedWeatherCondition(weather.main);
        weatherHighTemp = weather.highTemp;
        weatherLowTemp = weather.lowTemp;
        weatherDescription = weather.description || weather.main;
      }

      // Format date properly for API
      const formattedDate = formatDateForAPI(selectedDate);

      // Prepare data for backend - MAKE SURE ALL REQUIRED FIELDS ARE INCLUDED
      const stockData = stockItems.map((item, index) => {
        const totalStock = Number(item.totalStock) || 0;
        const returnQty = Number(item.returnQty) || 0;
        const soldQty = Math.max(0, totalStock - returnQty);

        // Get productCategory from the item
        let productCategory = item.productCategory?.trim();
        
        if (!productCategory || productCategory === '') {
          // If no category, create one based on productType
          if (item.productType === 'Greens') {
            productCategory = 'Mixed Greens';
          } else if (item.productType === 'Kitchen') {
            productCategory = 'General Kitchen';
          } else {
            productCategory = item.productType;
          }
        }

        // Create the data object with ALL required fields
        const stockItem = {
          _id: item.id && !item.id.toString().startsWith('new-') ? item.id : undefined,
          date: formattedDate,
          productType: item.productType?.trim() || "Unknown",
          productName: productCategory, // Required field: productName (using category as name)
          productCategory: productCategory, // Send the actual productCategory
          totalStock: totalStock,
          soldQty: soldQty,
          returnQty: returnQty,
          remainingQty: returnQty,
          unit: item.unit?.trim() || "pieces",
          location: marketLocation?.trim() || "Unknown",
          notes: `Weather: ${weatherCondition} (H:${weatherHighTemp}°C/L:${weatherLowTemp}°C)`,
          weatherCondition: weatherCondition,
          weatherHighTemp: weatherHighTemp,
          weatherLowTemp: weatherLowTemp,
          weatherDescription: weatherDescription,
        };

        // Log for debugging
        console.log(`Stock item ${index + 1}:`, stockItem);
        
        return stockItem;
      });

      console.log("Sending stock data to server:", stockData);

      // Send bulk request
      const response = await api.post("/stocks/bulk", stockData);

      console.log("Save response:", response.data);

      // Update local state with response data
      if (response.data && response.data.stocks) {
        const updatedStockItems = response.data.stocks.map((savedItem) => ({
          id: savedItem._id || savedItem.id,
          productType: savedItem.productType,
          productCategory: savedItem.productCategory || savedItem.productName || '',
          totalStock: savedItem.totalStock || 0,
          unit: savedItem.unit || 'pieces',
          returnQty: savedItem.returnQty || 0,
          soldQty: savedItem.soldQty || 0,
          remainingQty: savedItem.remainingQty || savedItem.totalStock || 0
        }));
        
        setStockItems(updatedStockItems);
      }

      setSuccess(`${stockItems.length} items saved successfully for ${marketLocation}!`);
      setTimeout(() => setSuccess(""), 5000);

    } catch (err) {
      console.error("Error saving items:", err);
      setError(`Error: ${err.response?.data?.message || "Failed to save items. Please check if all required fields are filled."}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedStocks = async () => {
    try {
      setLoading(true);
      
      const formattedDate = formatDateForAPI(selectedDate);
      
      const res = await api.get("/stocks/daily", {
        params: {
          date: formattedDate,
          location: marketLocation
        }
      });

      if (res.data && res.data.length > 0) {
        // Found saved data - use it
        const mapped = res.data.map((item) => ({
          id: item._id || item.id,
          productType: item.productType,
          productCategory: item.productCategory,
          totalStock: item.totalStock || 0,
          unit: item.unit || 'pieces',
          returnQty: item.returnQty || 0,
          soldQty: item.soldQty || 0,
          remainingQty: item.remainingQty || item.totalStock || 0
        }));

        setStockItems(mapped);
      } else {
        // No saved data found - create default product template
        const defaultItems = defaultProductsTemplate.map((product, index) => ({
          id: `default-${index}-${Date.now()}`,
          productType: product.productType,
          productCategory: product.productCategory,
          totalStock: 0,
          unit: product.unit,
          returnQty: 0,
          soldQty: 0,
          remainingQty: 0
        }));

        setStockItems(defaultItems);
      }
    } catch (err) {
      console.error("Error fetching saved stocks:", err);
      // On error, still show default template
      const defaultItems = defaultProductsTemplate.map((product, index) => ({
        id: `default-${index}-${Date.now()}`,
        productType: product.productType,
        productCategory: product.productCategory,
        totalStock: 0,
        unit: product.unit,
        returnQty: 0,
        soldQty: 0,
        remainingQty: 0
      }));

      setStockItems(defaultItems);
    } finally {
      setLoading(false);
    }
  };

  // Handle quantity change in table
  const handleQuantityChange = (index, field, value) => {
    const updatedItems = [...stockItems];
    const numValue = parseFloat(value) || 0;
    updatedItems[index][field] = numValue;
    
    // Update remainingQty and soldQty when returnQty changes
    if (field === 'returnQty') {
      updatedItems[index].soldQty = Math.max(0, updatedItems[index].totalStock - numValue);
      updatedItems[index].remainingQty = numValue;
    }
    
    // Update soldQty and remainingQty when totalStock changes
    if (field === 'totalStock') {
      updatedItems[index].soldQty = Math.max(0, numValue - updatedItems[index].returnQty);
      updatedItems[index].remainingQty = updatedItems[index].returnQty;
    }
    
    setStockItems(updatedItems);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Format date as MM/dd/yyyy
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Calculate totals
  const totalStock = stockItems.reduce((sum, item) => sum + (parseFloat(item.totalStock) || 0), 0);
  const totalReturned = stockItems.reduce((sum, item) => sum + (parseFloat(item.returnQty) || 0), 0);
  const totalSold = stockItems.reduce((sum, item) => sum + (parseFloat(item.soldQty) || 0), 0);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="add-stock-container">
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
          Stock Management
        </Typography>

        {/* Add New Product Button at the top */}
        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddCircleIcon />}
            onClick={() => setNewProductDialog(true)}
          >
            Add Missing Product to Listing
          </Button>
        </Box>

        {/* Tabs for Add/View */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Product Listing" sx={{ textTransform: 'none', fontWeight: 600 }} />
            {/* <Tab label="Add New Product" sx={{ textTransform: 'none', fontWeight: 600 }} /> */}
          </Tabs>
        </Box>

        {/* Market Details Section with Weather */}
        <Paper className="market-details-section" elevation={1} sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom className="section-title">
            Market Details
          </Typography>
          
          <Grid container spacing={2}>
            {/* Date and Location Section */}
            <Grid item xs={12} md={6}>
              <div className="market-details-grid">
                <div className="market-detail-item">
                  <Typography variant="subtitle2" className="detail-label">
                    Date
                  </Typography>
                  <DatePicker
                    value={selectedDate}
                    onChange={(newDate) => setSelectedDate(newDate)}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </div>
                
                <div className="market-detail-item">
                  <Typography variant="subtitle2" className="detail-label">
                    Market Location
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={marketLocation}
                      onChange={(e) => handleMarketLocationChange(e.target.value)}
                    >
                      {marketLocations.map((location) => (
                        <MenuItem key={location.name} value={location.name}>
                          {location.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
              </div>
            </Grid>
            
            {/* Weather Forecast Section */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      🌤️ Weather Forecast
                    </Typography>
                    {weatherLoading && <CircularProgress size={20} />}
                  </Box>
                  
                  {weatherError ? (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      {weatherError}
                    </Alert>
                  ) : weather ? (
                    <>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        {weather.icon && (
                          <img 
                            src={weather.icon} 
                            alt={weather.description}
                            style={{ width: 50, height: 50 }}
                          />
                        )}
                        <Box>
                          <Typography variant="h6" component="span">
                            {weather.temperature}°C
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Feels like {weather.feelsLike}°C
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            H: {weather.highTemp}°C • L: {weather.lowTemp}°C
                          </Typography>
                        </Box>
                        <Box flexGrow={1} textAlign="right">
                          <Typography variant="body1" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                            {weather.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {marketLocation}
                          </Typography>
                          {!weather.isForecast && (
                            <Typography variant="caption" color="warning" display="block">
                              Current weather (no forecast available)
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      <Box display="flex" gap={2} mb={2}>
                        <Chip 
                          size="small" 
                          label={`💧 ${weather.humidity}%`} 
                          variant="outlined" 
                        />
                        <Chip 
                          size="small" 
                          label={`💨 ${weather.windSpeed} m/s`} 
                          variant="outlined" 
                        />
                        {weather.rain > 0 && (
                          <Chip 
                            size="small" 
                            label={`🌧️ ${weather.rain}mm`} 
                            variant="outlined" 
                            color="primary"
                          />
                        )}
                        {weather.snow > 0 && (
                          <Chip 
                            size="small" 
                            label={`❄️ ${weather.snow}mm`} 
                            variant="outlined" 
                            color="primary"
                          />
                        )}
                        <Chip 
                          size="small" 
                          label={`📊 ${weather.pressure} hPa`} 
                          variant="outlined" 
                        />
                      </Box>
                      
                      <Alert 
                        severity={
                          weather.main.toLowerCase().includes('rain') || 
                          weather.main.toLowerCase().includes('snow') ? 'warning' : 'info'
                        }
                        icon={false}
                        sx={{ 
                          backgroundColor: weather.main.toLowerCase().includes('rain') ? 
                            'rgba(255, 193, 7, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                          fontSize: '0.875rem'
                        }}
                      >
                        {getWeatherImpact(weather)}
                      </Alert>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading weather forecast...
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {tabValue === 0 ? (
          /* Product Listing Section */
          <Box>
            <Typography variant="h6" gutterBottom className="section-title">
              Product Listing - {marketLocation} ({formatDate(selectedDate)})
            </Typography>
            
            {stockItems.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Loading products...
                </Typography>
              </Paper>
            ) : (
              <>
                <Paper className="stock-items-section" elevation={1}>
                  <TableContainer>
                    <Table className="stock-table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product Type</TableCell>
                          <TableCell>Product Category</TableCell>
                          <TableCell>Total Stock</TableCell>
                          <TableCell>Unit</TableCell>
                          <TableCell>Returned Items</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stockItems.map((item, index) => (
                          <TableRow key={item.id || index}>
                            <TableCell>{item.productType}</TableCell>
                            <TableCell>
                                {item.productCategory || 'No Category'}
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={item.totalStock}
                                onChange={(e) => handleQuantityChange(index, 'totalStock', e.target.value)}
                                InputProps={{ 
                                  inputProps: { min: 0, step: 0.5 }
                                }}
                                sx={{ width: 120 }}
                              />
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={item.returnQty}
                                onChange={(e) => handleQuantityChange(index, 'returnQty', e.target.value)}
                                InputProps={{ 
                                  inputProps: { min: 0, step: 0.5, max: item.totalStock }
                                }}
                                sx={{ width: 120 }}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="action-buttons">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteItem(index)}
                                  className="delete-button"
                                  title="Delete item"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* Summary Section */}
                <Paper className="summary-section" elevation={1} sx={{ mt: 3, p: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Products
                      </Typography>
                      <Typography variant="h5">
                        {stockItems.length}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Stock
                      </Typography>
                      <Typography variant="h5">
                        {totalStock}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Returned
                      </Typography>
                      <Typography variant="h5">
                        {totalReturned}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Net Sales
                      </Typography>
                      <Typography variant="h5" color="primary">
                        {totalSold}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Weather summary when saving */}
                  {weather && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Weather Summary (will be saved with data):
                      </Typography>
                      <Typography variant="body2">
                        Condition: {weather.condition} • High: {weather.highTemp}°C • Low: {weather.lowTemp}°C • {weather.description}
                      </Typography>
                    </Box>
                  )}

                  {/* Save Button - Simplified to just one button */}
                  <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                      onClick={handleSave}
                      disabled={loading}
                      size="large"
                    >
                      Save/Update
                    </Button>
                  </Box>
                </Paper>
              </>
            )}
          </Box>
        ) : (
          /* Add New Product Form */
          <Paper className="stock-item-form" elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom className="section-title">
              Add New Product
            </Typography>

            <Grid container spacing={2}>
              {/* Product Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Product Type *</InputLabel>
                  <Select
                    value={formData.productType}
                    onChange={handleTypeChange}
                    label="Product Type *"
                  >
                    <MenuItem value="">Select Type</MenuItem>
                    {productTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Product Category */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Product Category *</InputLabel>
                  <Select
                    value={formData.productCategory}
                    onChange={handleCategoryChange}
                    label="Product Category *"
                    disabled={!formData.productType}
                  >
                    <MenuItem value="">Select Category</MenuItem>
                    {formData.productType && productCategories[formData.productType]?.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Total Stock */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <TextField
                    label="Total Stock *"
                    type="number"
                    value={formData.totalStock}
                    onChange={(e) => setFormData({...formData, totalStock: e.target.value})}
                    InputProps={{ 
                      inputProps: { min: 0, step: 0.5 }
                    }}
                    helperText="Enter 0.5 for half cases"
                  />
                </FormControl>
              </Grid>

              {/* Unit */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Unit *</InputLabel>
                  <Select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    label="Unit *"
                  >
                    {units.map((unit) => (
                      <MenuItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Add Button */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                onClick={handleAddToList}
                size="large"
                disabled={
                  !formData.productType ||
                  !formData.productCategory ||
                  formData.totalStock === '' || formData.totalStock === null
                }
                sx={{ mr: 2 }}
              >
                Add to List
              </Button>
              <Button
                variant="outlined"
                onClick={() => setTabValue(0)}
                size="large"
                sx={{ ml: 2 }}
              >
                View Listing
              </Button>
            </Box>
          </Paper>
        )}

        {/* Add Missing Product Dialog */}
        <Dialog open={newProductDialog} onClose={() => setNewProductDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Missing Product to Listing</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add a product that is missing from the current stock listing.
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Product Type */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Product Type *</InputLabel>
                  <Select
                    value={newProductData.productType}
                    onChange={handleNewProductChange('productType')}
                    label="Product Type *"
                  >
                    <MenuItem value="">Select Type</MenuItem>
                    {productTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Product Category */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Product Category *</InputLabel>
                  <Select
                    value={newProductData.productCategory}
                    onChange={handleNewProductChange('productCategory')}
                    label="Product Category *"
                    disabled={!newProductData.productType}
                  >
                    <MenuItem value="">Select Category</MenuItem>
                    {newProductData.productType && 
                     productCategories[newProductData.productType]?.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Unit */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Unit *</InputLabel>
                  <Select
                    value={newProductData.unit}
                    onChange={handleNewProductChange('unit')}
                    label="Unit *"
                  >
                    {units.map((unit) => (
                      <MenuItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              This product will be added to your current listing with Total Stock = 0 and Returned Items = 0.
              You can then adjust the Total Stock in the listing table.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewProductDialog(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleAddNewProduct}
              disabled={!newProductData.productType || !newProductData.productCategory}
            >
              Add Product to Listing
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </LocalizationProvider>
  );
};


export default AddStock;