import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  ListItemText,
  Chip,
  Autocomplete,
  TextField,
  Slider,
  Divider
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,  // Make sure this is imported
  ReferenceLine
} from 'recharts';
import api from '../../services/api';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import UmbrellaIcon from '@mui/icons-material/Umbrella';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Market locations (same as in AddStock.jsx)
const marketLocations = [
  { name: 'Union Square (Monday) Manhattan' },
  { name: 'Union Square (Wednesday) Manhattan' },
  { name: 'Columbia University (Thursday) Upper west side Manhattan' },
  { name: 'Union Square (Saturday) Manhattan' },
  { name: 'Tribecca (Saturday) Lower Manhattan' },
  { name: 'Larchmont (Saturday) Westchester NY' },
  { name: 'Carrol Gardens (Sunday) Brooklyn' },
  { name: 'Jackson Heights (Sunday) Queens' }
];

// Months for selection
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

// Product Types from ProductManagement
const productTypes = ['Greens', 'Kitchen'];

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

// Weather condition icons mapping
const getWeatherIcon = (condition) => {
  if (!condition) return null;
  
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
  
  return <WbSunnyIcon sx={{ color: '#FFD700' }} />;
};

// Get weather impact color based on condition
const getWeatherImpactColor = (condition) => {
  if (!condition) return '#ccc';
  
  const conditionLower = condition.toLowerCase();
  
  if (conditionLower.includes('sunny') || conditionLower.includes('clear')) 
    return '#FFD700';
  if (conditionLower.includes('cloud')) 
    return '#A9A9A9';
  if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) 
    return '#4169E1';
  if (conditionLower.includes('snow') || conditionLower.includes('sleet')) 
    return '#87CEEB';
  if (conditionLower.includes('thunder')) 
    return '#4B0082';
  if (conditionLower.includes('fog') || conditionLower.includes('mist'))
    return '#B0C4DE';
  
  return '#FFD700';
};

const Reports = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Common filter states
  const [selectedLocation, setSelectedLocation] = useState(marketLocations[0].name);
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedProductType, setSelectedProductType] = useState('Greens');
  
  // Location Comparison specific states
  const [selectedLocations, setSelectedLocations] = useState([marketLocations[0].name]);
  
  // Annual Comparison specific states
  const [selectedYearFirst, setSelectedYearFirst] = useState((currentYear - 1).toString());
  const [selectedYearSecond, setSelectedYearSecond] = useState(currentYear.toString());
  
  // Weather Impact Analysis specific states
  const [lowSalesThreshold, setLowSalesThreshold] = useState(50); // Percentage threshold for low sales
  const [weatherImpactData, setWeatherImpactData] = useState([]);
  const [lowSalesDays, setLowSalesDays] = useState([]);
  const [weatherSummary, setWeatherSummary] = useState({
    totalDays: 0,
    lowSalesDaysCount: 0,
    avgSales: 0,
    avgTemp: 0,
    weatherImpact: {}
  });
  
  // Data states for different reports
  const [monthlyChartData, setMonthlyChartData] = useState([]);
  const [productWiseData, setProductWiseData] = useState([]);
  const [locationComparisonData, setLocationComparisonData] = useState([]);
  const [annualComparisonData, setAnnualComparisonData] = useState([]);
  
  // Summary states
  const [monthlySummary, setMonthlySummary] = useState({
    totalProductsQty: 0,
    totalReturnedQty: 0,
    totalSoldQty: 0
  });
  
  const [annualComparisonSummary, setAnnualComparisonSummary] = useState({
    firstYear: { totalSales: 0, avgSales: 0, growth: 0 },
    secondYear: { totalSales: 0, avgSales: 0, growth: 0 }
  });
  
  const [productSummary, setProductSummary] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Function to convert month name to number (1-12)
  const getMonthNumber = (monthName) => {
    return months.indexOf(monthName) + 1;
  };

  // Function to get start and end dates for the selected month/year
  const getMonthDateRange = (monthName, year) => {
    const monthNumber = getMonthNumber(monthName);
    const yearNum = parseInt(year);
    
    const startDate = new Date(yearNum, monthNumber - 1, 1);
    const endDate = new Date(yearNum, monthNumber, 0);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    };
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle multiple location selection for Location Comparison
  const handleLocationMultiSelect = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedLocations(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  // Generate Monthly Sales Report
  const generateMonthlyReport = async () => {
    try {
      setLoading(true);
      setError("");
      
      const { startDate, endDate } = getMonthDateRange(selectedMonth, selectedYear);
      
      const response = await api.get("/reports/sales-by-location", {
        params: {
          location: selectedLocation,
          startDate,
          endDate
        }
      });
      
      if (response.data && response.data.length > 0) {
        const processedData = response.data.map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          totalStock: item.totalStock || 0,
          returnQty: item.returnQty || 0,
          soldQty: item.soldQty || 0
        }));
        
        setMonthlyChartData(processedData);
        
        const totals = processedData.reduce((acc, item) => ({
          totalProductsQty: acc.totalProductsQty + (item.totalStock || 0),
          totalReturnedQty: acc.totalReturnedQty + (item.returnQty || 0),
          totalSoldQty: acc.totalSoldQty + (item.soldQty || 0)
        }), { totalProductsQty: 0, totalReturnedQty: 0, totalSoldQty: 0 });
        
        setMonthlySummary(totals);
        setSuccess(`Monthly report generated for ${selectedLocation} - ${selectedMonth} ${selectedYear}`);
      } else {
        setMonthlyChartData([]);
        setMonthlySummary({ totalProductsQty: 0, totalReturnedQty: 0, totalSoldQty: 0 });
        setSuccess(`No data found for ${selectedLocation} - ${selectedMonth} ${selectedYear}`);
      }
      
    } catch (err) {
      console.error("Monthly report error:", err);
      setError(`Error generating monthly report: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate Product-wise Report
  const generateProductReport = async () => {
    try {
      setLoading(true);
      setError("");
      
      const { startDate, endDate } = getMonthDateRange(selectedMonth, selectedYear);
      
      const response = await api.get("/reports/product-wise-returns", {
        params: {
          location: selectedLocation,
          productType: selectedProductType,
          startDate,
          endDate
        }
      });
      
      if (response.data && response.data.length > 0) {
        const mappedData = response.data.map(item => ({
          productName: item.category || item.productName || 'Unknown Product',
          totalStock: Number(item.totalStock) || 0,
          soldQty: Number(item.soldQty) || 0,
          returnQty: Number(item.returnQty) || 0
        }));
        
        const sortedData = mappedData.sort((a, b) => b.returnQty - a.returnQty);
        setProductWiseData(sortedData);
        setSuccess(`Product-wise report generated for ${selectedLocation} - ${selectedMonth} ${selectedYear} - Type: ${selectedProductType}`);
      } else {
        setProductWiseData([]);
        setSuccess(`No product data found for ${selectedLocation} - ${selectedMonth} ${selectedYear} - Type: ${selectedProductType}`);
      }
      
    } catch (err) {
      console.error("Product report error:", err);
      setError(`Error generating product report: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate Location Comparison Report
  const generateLocationReport = async () => {
    try {
      setLoading(true);
      setError("");
      
      const monthNumber = getMonthNumber(selectedMonth);
      const yearNumber = parseInt(selectedYear);
      
      const params = {
        month: monthNumber,
        year: yearNumber
      };
      
      if (selectedLocations.length > 0 && selectedLocations.length < marketLocations.length) {
        params.locations = selectedLocations.join(',');
      }
      
      const response = await api.get("/reports/location-comparison", { params });
      
      if (response.data && response.data.length > 0) {
        const formattedData = response.data.map(item => ({
          location: item.location,
          totalStock: item.totalStock || 0,
          totalSold: item.totalSold || 0,
          totalReturned: item.totalReturned || 0,
          salesPercentage: item.salesPercentage || 0,
          revenue: item.revenue || 0
        }));
        
        setLocationComparisonData(formattedData);
        setSuccess(`Location comparison report generated for ${selectedMonth} ${selectedYear}`);
      } else {
        setLocationComparisonData([]);
        setSuccess(`No location data found for ${selectedMonth} ${selectedYear}`);
      }
      
    } catch (err) {
      console.error("Location report error:", err);
      setError(`Error generating location report: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate Annual Comparison Report
  const generateAnnualComparisonReport = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Get data for first year
      const firstYearRange = getMonthDateRange(selectedMonth, selectedYearFirst);
      const secondYearRange = getMonthDateRange(selectedMonth, selectedYearSecond);
      
      // Fetch data for both years
      const [firstYearResponse, secondYearResponse] = await Promise.all([
        api.get("/reports/sales-by-location", {
          params: {
            location: selectedLocation,
            startDate: firstYearRange.startDate,
            endDate: firstYearRange.endDate
          }
        }),
        api.get("/reports/sales-by-location", {
          params: {
            location: selectedLocation,
            startDate: secondYearRange.startDate,
            endDate: secondYearRange.endDate
          }
        })
      ]);
      
      // Process both years data
      const processYearData = (data, year) => {
        if (!data || !data.data || data.data.length === 0) {
          return [];
        }
        
        return data.data.map(item => ({
          date: new Date(item.date).getDate(),
          day: new Date(item.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          [`sold_${year}`]: item.soldQty || 0,
          [`stock_${year}`]: item.totalStock || 0,
          [`return_${year}`]: item.returnQty || 0
        }));
      };
      
      const firstYearData = processYearData(firstYearResponse, selectedYearFirst);
      const secondYearData = processYearData(secondYearResponse, selectedYearSecond);
      
      // Merge data by date
      const mergedData = [];
      
      // Get all unique days from both datasets
      const allDays = new Set([
        ...firstYearData.map(item => item.date),
        ...secondYearData.map(item => item.date)
      ]);
      
      allDays.forEach(day => {
        const firstYearItem = firstYearData.find(item => item.date === day);
        const secondYearItem = secondYearData.find(item => item.date === day);
        
        mergedData.push({
          date: day,
          day: `Day ${day}`,
          [`sold_${selectedYearFirst}`]: firstYearItem?.[`sold_${selectedYearFirst}`] || 0,
          [`sold_${selectedYearSecond}`]: secondYearItem?.[`sold_${selectedYearSecond}`] || 0,
          [`stock_${selectedYearFirst}`]: firstYearItem?.[`stock_${selectedYearFirst}`] || 0,
          [`stock_${selectedYearSecond}`]: secondYearItem?.[`stock_${selectedYearSecond}`] || 0
        });
      });
      
      // Sort by date
      mergedData.sort((a, b) => a.date - b.date);
      
      // Calculate summary
      const firstYearTotal = firstYearData.reduce((sum, item) => sum + item[`sold_${selectedYearFirst}`], 0);
      const secondYearTotal = secondYearData.reduce((sum, item) => sum + item[`sold_${selectedYearSecond}`], 0);
      
      const firstYearAvg = firstYearData.length > 0 ? firstYearTotal / firstYearData.length : 0;
      const secondYearAvg = secondYearData.length > 0 ? secondYearTotal / secondYearData.length : 0;
      
      const growth = firstYearTotal > 0 
        ? ((secondYearTotal - firstYearTotal) / firstYearTotal) * 100 
        : 0;
      
      setAnnualComparisonSummary({
        firstYear: { 
          totalSales: firstYearTotal, 
          avgSales: firstYearAvg, 
          growth: 0 
        },
        secondYear: { 
          totalSales: secondYearTotal, 
          avgSales: secondYearAvg, 
          growth: growth 
        }
      });
      
      setAnnualComparisonData(mergedData);
      setSuccess(`Annual comparison report generated for ${selectedLocation} - ${selectedMonth} ${selectedYearFirst} vs ${selectedYearSecond}`);
      
    } catch (err) {
      console.error("Annual comparison error:", err);
      setError(`Error generating annual comparison report: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate Weather Impact Report
  const generateWeatherReport = async () => {
    try {
      setLoading(true);
      setError("");
      
      const { startDate, endDate } = getMonthDateRange(selectedMonth, selectedYear);
      
      const response = await api.get("/reports/sales-by-location", {
        params: {
          location: selectedLocation,
          startDate,
          endDate
        }
      });
      
      if (response.data && response.data.length > 0) {
        // Process the data to include weather information
        const processedData = response.data.map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            weekday: 'short'
          }),
          fullDate: item.date,
          dayOfWeek: new Date(item.date).getDay(),
          soldQty: item.soldQty || 0,
          totalStock: item.totalStock || 0,
          returnQty: item.returnQty || 0,
          weatherCondition: item.weatherCondition || 'Unknown',
          weatherHighTemp: item.weatherHighTemp || null,
          weatherLowTemp: item.weatherLowTemp || null,
          weatherDescription: item.weatherDescription || 'No weather data',
          salesPercentage: item.totalStock > 0 ? ((item.soldQty || 0) / item.totalStock * 100).toFixed(1) : 0
        })).filter(item => item.soldQty > 0); // Only include days with sales
        
        setWeatherImpactData(processedData);
        
        // Calculate average sales for the month
        const avgSales = processedData.reduce((sum, item) => sum + item.soldQty, 0) / processedData.length;
        
        // Identify low sales days (below threshold percentage of average)
        const lowDays = processedData.filter(item => {
          const salesPercentage = (item.soldQty / avgSales) * 100;
          return salesPercentage < lowSalesThreshold;
        });
        
        setLowSalesDays(lowDays);
        
        // Calculate weather impact summary
        const weatherImpactSummary = {};
        processedData.forEach(item => {
          const condition = item.weatherCondition || 'Unknown';
          if (!weatherImpactSummary[condition]) {
            weatherImpactSummary[condition] = {
              count: 0,
              totalSales: 0,
              avgSales: 0,
              lowSalesDays: 0
            };
          }
          weatherImpactSummary[condition].count++;
          weatherImpactSummary[condition].totalSales += item.soldQty;
          
          // Check if it's a low sales day for this weather condition
          if (lowDays.find(day => day.fullDate === item.fullDate)) {
            weatherImpactSummary[condition].lowSalesDays++;
          }
        });
        
        // Calculate averages
        Object.keys(weatherImpactSummary).forEach(condition => {
          weatherImpactSummary[condition].avgSales = 
            weatherImpactSummary[condition].totalSales / weatherImpactSummary[condition].count;
        });
        
        // Calculate average temperature
        const tempData = processedData.filter(item => item.weatherHighTemp !== null && item.weatherLowTemp !== null);
        const avgTemp = tempData.length > 0 
          ? tempData.reduce((sum, item) => sum + ((item.weatherHighTemp + item.weatherLowTemp) / 2), 0) / tempData.length
          : 0;
        
        setWeatherSummary({
          totalDays: processedData.length,
          lowSalesDaysCount: lowDays.length,
          avgSales: avgSales,
          avgTemp: avgTemp,
          weatherImpact: weatherImpactSummary
        });
        
        setSuccess(`Weather impact report generated for ${selectedLocation} - ${selectedMonth} ${selectedYear}. Found ${lowDays.length} days with low sales.`);
      } else {
        setWeatherImpactData([]);
        setLowSalesDays([]);
        setWeatherSummary({
          totalDays: 0,
          lowSalesDaysCount: 0,
          avgSales: 0,
          avgTemp: 0,
          weatherImpact: {}
        });
        setSuccess(`No data found for ${selectedLocation} - ${selectedMonth} ${selectedYear}`);
      }
      
    } catch (err) {
      console.error("Weather report error:", err);
      setError(`Error generating weather report: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle generate button based on active tab
  const handleGenerateReport = () => {
    switch(activeTab) {
      case 0: // Monthly Sales
        generateMonthlyReport();
        break;
      case 1: // Product-wise
        generateProductReport();
        break;
      case 2: // Location Comparison
        generateLocationReport();
        break;
      case 3: // Annual Comparison
        generateAnnualComparisonReport();
        break;
      case 4: // Weather Impact
        generateWeatherReport();
        break;
      default:
        generateMonthlyReport();
    }
  };

  // Initialize with first report
  useEffect(() => {
    generateMonthlyReport();
  }, []);

  // Render Monthly Sales Report (Tab 0)
  const renderMonthlySalesReport = () => (
    <>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Products Quantity
              </Typography>
              <Typography variant="h4" component="div">
                {monthlySummary.totalProductsQty}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Returned Quantity
              </Typography>
              <Typography variant="h4" component="div" color="error">
                {monthlySummary.totalReturnedQty}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Sold Quantity
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {monthlySummary.totalSoldQty}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sales Trend: {selectedLocation} - {selectedMonth} {selectedYear}
        </Typography>
        
        {monthlyChartData.length > 0 ? (
          <Box sx={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar name="Total Stock" dataKey="totalStock" fill="#8884d8" />
                <Bar name="Returned Qty" dataKey="returnQty" fill="#ff7300" />
                <Bar name="Sold Qty" dataKey="soldQty" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="textSecondary">No data available</Typography>
          </Box>
        )}
      </Paper>
    </>
  );

  // Render Product-wise Report (Tab 1)
  const renderProductWiseReport = () => {
    const returnSummary = productWiseData.reduce((acc, item) => ({
      totalReturned: acc.totalReturned + (Number(item.returnQty) || 0),
      totalStock: acc.totalStock + (Number(item.totalStock) || 0),
      totalSold: acc.totalSold + (Number(item.soldQty) || 0),
      productCount: acc.productCount + 1
    }), { totalReturned: 0, totalStock: 0, totalSold: 0, productCount: 0 });
    
    return (
      <>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Products
                </Typography>
                <Typography variant="h4" component="div">
                  {returnSummary.productCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Stock
                </Typography>
                <Typography variant="h4" component="div">
                  {returnSummary.totalStock}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Returned
                </Typography>
                <Typography variant="h4" component="div" color="error">
                  {returnSummary.totalReturned}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Return Rate
                </Typography>
                <Typography variant="h4" component="div" color="warning.main">
                  {returnSummary.totalStock > 0 
                    ? `${((returnSummary.totalReturned / returnSummary.totalStock) * 100).toFixed(1)}%`
                    : '0%'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Products with Highest Returns: {selectedProductType} - {selectedLocation} - {selectedMonth} {selectedYear}
          </Typography>
          
          {loading ? (
            <Box sx={{ 
              height: 400, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading chart data...</Typography>
            </Box>
          ) : productWiseData.length > 0 ? (
            <>
              <Box sx={{ 
                width: '100%', 
                height: 400,
                mb: 3,
                position: 'relative'
              }}>
                <ResponsiveContainer width="100%" height="100%" debounce={1}>
                  <BarChart 
                    data={productWiseData.slice(0, 10)}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="productName" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar name="Returned Qty" dataKey="returnQty" fill="#ff7300" />
                    <Bar name="Sold Qty" dataKey="soldQty" fill="#82ca9d" />
                    <Bar name="Total Stock" dataKey="totalStock" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Product Name</TableCell>
                      <TableCell align="right">Total Stock</TableCell>
                      <TableCell align="right">Sold Qty</TableCell>
                      <TableCell align="right" sx={{ backgroundColor: '#ffeeee' }}>
                        <Typography fontWeight="bold" color="error">
                          Returned Qty
                        </Typography>
                      </TableCell>
                      <TableCell align="right">Return Rate</TableCell>
                      <TableCell align="right">Sales Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productWiseData.map((product, index) => {
                      const returnRate = product.totalStock > 0 
                        ? ((product.returnQty / product.totalStock) * 100).toFixed(1)
                        : 0;
                      const salesRate = product.totalStock > 0 
                        ? ((product.soldQty / product.totalStock) * 100).toFixed(1)
                        : 0;
                      
                      return (
                        <TableRow 
                          key={index}
                          sx={{ 
                            '&:hover': { backgroundColor: '#f5f5f5' },
                            ...(index < 3 ? { backgroundColor: '#fff8e8' } : {})
                          }}
                        >
                          <TableCell>
                            <Chip 
                              label={index + 1} 
                              size="small"
                              color={index === 0 ? "error" : index === 1 ? "warning" : index === 2 ? "info" : "default"}
                              sx={{ fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography fontWeight={index < 3 ? "bold" : "normal"}>
                              {product.productName}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{product.totalStock}</TableCell>
                          <TableCell align="right">{product.soldQty}</TableCell>
                          <TableCell align="right" sx={{ backgroundColor: '#ffeeee' }}>
                            <Typography fontWeight="bold" color="error">
                              {product.returnQty || 0}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`${returnRate}%`} 
                              size="small"
                              color={returnRate > 20 ? "error" : returnRate > 10 ? "warning" : "success"}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {salesRate}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Box sx={{ 
              height: 400, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography color="textSecondary">
                No product data available for the selected filters. Try generating the report.
              </Typography>
            </Box>
          )}
        </Paper>
      </>
    );
  };

  // Render Location Comparison Report (Tab 2)
  const renderLocationComparisonReport = () => (
    <>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Location Comparison - {selectedMonth} {selectedYear}
          <Typography variant="body2" color="textSecondary">
            Selected Locations: {selectedLocations.length}
          </Typography>
        </Typography>
        
        {locationComparisonData.length > 0 ? (
          <>
            <div style={{ width: '100%', height: '400px', marginBottom: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="location" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar name="Total Stock" dataKey="totalStock" fill="#8884d8" />
                  <Bar name="Sold Qty" dataKey="totalSold" fill="#82ca9d" />
                  <Bar name="Returned Qty" dataKey="totalReturned" fill="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <TableContainer sx={{ mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Location</TableCell>
                    <TableCell align="right">Total Stock</TableCell>
                    <TableCell align="right">Sold Qty</TableCell>
                    <TableCell align="right">Returned Qty</TableCell>
                    <TableCell align="right">Sales %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {locationComparisonData.map((location, index) => (
                    <TableRow key={index}>
                      <TableCell>{location.location}</TableCell>
                      <TableCell align="right">{location.totalStock}</TableCell>
                      <TableCell align="right">{location.totalSold}</TableCell>
                      <TableCell align="right">{location.totalReturned || 0}</TableCell>
                      <TableCell align="right">
                        {location.salesPercentage ? `${location.salesPercentage}%` : '0%'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <div style={{ 
            height: '400px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Typography color="textSecondary">
              No location comparison data available
            </Typography>
          </div>
        )}
      </Paper>
    </>
  );

  // Render Annual Comparison Report (Tab 3)
  const renderAnnualComparisonReport = () => (
    <>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {selectedYearFirst} Total Sales
              </Typography>
              <Typography variant="h4" component="div" color="info.main">
                {annualComparisonSummary.firstYear.totalSales.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg: {annualComparisonSummary.firstYear.avgSales.toFixed(1)}/day
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {selectedYearSecond} Total Sales
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {annualComparisonSummary.secondYear.totalSales.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Avg: {annualComparisonSummary.secondYear.avgSales.toFixed(1)}/day
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Growth
              </Typography>
              <Typography 
                variant="h4" 
                component="div" 
                color={annualComparisonSummary.secondYear.growth >= 0 ? "success.main" : "error"}
              >
                {annualComparisonSummary.secondYear.growth >= 0 ? '+' : ''}
                {annualComparisonSummary.secondYear.growth.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedYearFirst} → {selectedYearSecond}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Days Compared
              </Typography>
              <Typography variant="h4" component="div">
                {annualComparisonData.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Month: {selectedMonth}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Annual Sales Comparison: {selectedLocation} - {selectedMonth} {selectedYearFirst} vs {selectedYearSecond}
        </Typography>
        
        {annualComparisonData.length > 0 ? (
          <>
            <Box sx={{ width: '100%', height: 400, mb: 3 }}>
              <ResponsiveContainer>
                <ComposedChart data={annualComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey={`stock_${selectedYearFirst}`} 
                    fill="#e0f7fa" 
                    stroke="#80deea" 
                    name={`${selectedYearFirst} Stock`}
                    opacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={`stock_${selectedYearSecond}`} 
                    fill="#f3e5f5" 
                    stroke="#ce93d8" 
                    name={`${selectedYearSecond} Stock`}
                    opacity={0.6}
                  />
                  <Bar 
                    dataKey={`sold_${selectedYearFirst}`} 
                    fill="#0088FE" 
                    name={`${selectedYearFirst} Sales`}
                  />
                  <Bar 
                    dataKey={`sold_${selectedYearSecond}`} 
                    fill="#00C49F" 
                    name={`${selectedYearSecond} Sales`}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Daily Sales Comparison Table
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Day</TableCell>
                    <TableCell align="right" sx={{ backgroundColor: '#e8f4fd' }}>
                      {selectedYearFirst} Sales
                    </TableCell>
                    <TableCell align="right" sx={{ backgroundColor: '#e8f4fd' }}>
                      {selectedYearFirst} Stock
                    </TableCell>
                    <TableCell align="right" sx={{ backgroundColor: '#e8f4fd' }}>
                      {selectedYearFirst} Sales %
                    </TableCell>
                    <TableCell align="right" sx={{ backgroundColor: '#e8f5e8' }}>
                      {selectedYearSecond} Sales
                    </TableCell>
                    <TableCell align="right" sx={{ backgroundColor: '#e8f5e8' }}>
                      {selectedYearSecond} Stock
                    </TableCell>
                    <TableCell align="right" sx={{ backgroundColor: '#e8f5e8' }}>
                      {selectedYearSecond} Sales %
                    </TableCell>
                    <TableCell align="right">
                      Change
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {annualComparisonData.map((dayData, index) => {
                    const firstYearSales = dayData[`sold_${selectedYearFirst}`] || 0;
                    const secondYearSales = dayData[`sold_${selectedYearSecond}`] || 0;
                    const firstYearStock = dayData[`stock_${selectedYearFirst}`] || 0;
                    const secondYearStock = dayData[`stock_${selectedYearSecond}`] || 0;
                    
                    const firstYearSalesRate = firstYearStock > 0 
                      ? ((firstYearSales / firstYearStock) * 100).toFixed(1)
                      : '0.0';
                    
                    const secondYearSalesRate = secondYearStock > 0 
                      ? ((secondYearSales / secondYearStock) * 100).toFixed(1)
                      : '0.0';
                    
                    const change = firstYearSales > 0 
                      ? ((secondYearSales - firstYearSales) / firstYearSales * 100).toFixed(1)
                      : secondYearSales > 0 ? '100.0' : '0.0';
                    
                    return (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography fontWeight="medium">
                            {dayData.day}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#f5faff' }}>
                          {firstYearSales}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#f5faff' }}>
                          {firstYearStock}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#f5faff' }}>
                          {firstYearSalesRate}%
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#f5fff5' }}>
                          {secondYearSales}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#f5fff5' }}>
                          {secondYearStock}
                        </TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#f5fff5' }}>
                          {secondYearSalesRate}%
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${parseFloat(change) >= 0 ? '+' : ''}${change}%`}
                            size="small"
                            color={parseFloat(change) > 0 ? "success" : parseFloat(change) < 0 ? "error" : "default"}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="textSecondary">
              No annual comparison data available. Select years and generate report.
            </Typography>
          </Box>
        )}
      </Paper>
    </>
  );

  // Render Weather Impact Report (Tab 4)
  const renderWeatherImpactReport = () => (
    <>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Market Days
              </Typography>
              <Typography variant="h4" component="div">
                {weatherSummary.totalDays}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedMonth} {selectedYear}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Low Sales Days
              </Typography>
              <Typography variant="h4" component="div" color="error">
                {weatherSummary.lowSalesDaysCount}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Below {lowSalesThreshold}% of average
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Sales
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {weatherSummary.avgSales.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Per day average
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Temperature
              </Typography>
              <Typography variant="h4" component="div" color="info.main">
                {weatherSummary.avgTemp.toFixed(1)}°C
              </Typography>
              <Typography variant="body2" color="textSecondary">
                High/Low average
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Low Sales Days Analysis */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Days with Very Low Sales & Weather Analysis
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Showing days where sales were below {lowSalesThreshold}% of the monthly average.
          Weather data is captured from AddStock entries.
        </Typography>
        
        {lowSalesDays.length > 0 ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#fff8e8' }}>
                    <TableCell>Date</TableCell>
                    <TableCell>Day</TableCell>
                    <TableCell align="right">Sold Qty</TableCell>
                    <TableCell align="right">Total Stock</TableCell>
                    <TableCell align="right">Sales %</TableCell>
                    <TableCell align="center">Weather Condition</TableCell>
                    <TableCell align="right">High Temp</TableCell>
                    <TableCell align="right">Low Temp</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Impact</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowSalesDays.map((day, index) => {
                    const salesPercentage = (day.soldQty / weatherSummary.avgSales) * 100;
                    const isCritical = salesPercentage < 30;
                    
                    return (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:hover': { backgroundColor: '#f9f9f9' },
                          ...(isCritical ? { backgroundColor: '#fff0f0' } : {})
                        }}
                      >
                        <TableCell>
                          <Typography fontWeight="medium">
                            {day.date}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={day.date.split(',')[0]} 
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            color={isCritical ? "error" : "warning.main"}
                            fontWeight="bold"
                          >
                            {day.soldQty}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {((day.soldQty / weatherSummary.avgSales) * 100).toFixed(0)}% of avg
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{day.totalStock}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${day.salesPercentage}%`}
                            size="small"
                            color={day.salesPercentage < 50 ? "error" : "warning"}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            {getWeatherIcon(day.weatherCondition)}
                            <Typography variant="body2">
                              {day.weatherCondition}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {day.weatherHighTemp ? `${day.weatherHighTemp}°C` : 'N/A'}
                        </TableCell>
                        <TableCell align="right">
                          {day.weatherLowTemp ? `${day.weatherLowTemp}°C` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {day.weatherDescription}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {isCritical ? (
                            <Chip 
                              icon={<ErrorOutlineIcon />}
                              label="Critical"
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          ) : (
                            <Chip 
                              label="Low"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Weather Impact Summary */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Weather Impact Summary
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(weatherSummary.weatherImpact).map(([condition, data]) => (
                  <Grid item xs={12} sm={6} md={4} key={condition}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ 
                            width: 24, 
                            height: 24, 
                            borderRadius: '50%', 
                            backgroundColor: getWeatherImpactColor(condition),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mr: 1
                          }}>
                            {getWeatherIcon(condition)}
                          </Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {condition}
                          </Typography>
                        </Box>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">
                              Days
                            </Typography>
                            <Typography variant="body2">
                              {data.count}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">
                              Avg Sales
                            </Typography>
                            <Typography variant="body2" color="primary">
                              {data.avgSales.toFixed(1)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">
                              Low Sales Days
                            </Typography>
                            <Typography variant="body2" color={data.lowSalesDays > 0 ? "error" : "success"}>
                              {data.lowSalesDays}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="textSecondary">
                              Low Sales Rate
                            </Typography>
                            <Typography variant="body2" color={data.lowSalesDays > 0 ? "error" : "success"}>
                              {data.count > 0 ? ((data.lowSalesDays / data.count) * 100).toFixed(0) : 0}%
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        ) : weatherImpactData.length > 0 ? (
          <Box sx={{ 
            height: 200, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <Typography variant="h6" color="success.main">
              Great news! No low sales days found.
            </Typography>
            <Typography color="textSecondary">
              All sales days were above {lowSalesThreshold}% of the monthly average.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            height: 200, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Typography color="textSecondary">
              No weather impact data available. Select location, month, year and generate report.
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Sales vs Weather Chart */}
      {weatherImpactData.length > 0 && (
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Sales vs Weather Conditions: {selectedLocation} - {selectedMonth} {selectedYear}
          </Typography>
          <Box sx={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  name="Date"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  dataKey="soldQty" 
                  name="Sales Quantity" 
                  label={{ 
                    value: 'Sales Quantity', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: -10
                  }}
                />
                <ZAxis 
                  dataKey="weatherCondition"
                  name="Weather Condition"
                  range={[100, 400]}
                />
                <Tooltip 
                  formatter={(value, name, props) => {
                    if (name === 'soldQty') return [value, 'Sales Quantity'];
                    if (name === 'weatherCondition') return [value, 'Weather'];
                    return [value, name];
                  }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <Paper sx={{ p: 2 }}>
                          <Typography variant="subtitle2">{data.date}</Typography>
                          <Typography variant="body2">Sales: {data.soldQty}</Typography>
                          <Typography variant="body2">Weather: {data.weatherCondition}</Typography>
                          <Typography variant="caption">Temp: {data.weatherHighTemp}°C / {data.weatherLowTemp}°C</Typography>
                        </Paper>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <ReferenceLine 
                  y={weatherSummary.avgSales} 
                  stroke="#8884d8" 
                  strokeDasharray="3 3"
                  label={{ 
                    value: `Avg: ${weatherSummary.avgSales.toFixed(1)}`, 
                    position: 'right',
                    fill: '#8884d8'
                  }}
                />
                <Scatter 
                  name="Sales by Weather" 
                  data={weatherImpactData} 
                  fill="#8884d8"
                  shape={(props) => {
                    const { cx, cy, payload } = props;
                    const color = getWeatherImpactColor(payload.weatherCondition);
                    return <circle cx={cx} cy={cy} r={8} fill={color} stroke="#333" strokeWidth={1} />;
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}
    </>
  );

  return (
    <div className="reports-container" style={{ padding: '20px' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Reports Dashboard
      </Typography>
      
      {/* Tabs for different reports */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Monthly Sales Report" />
          <Tab label="Product-wise Report" />
          <Tab label="Location Comparison" />
          <Tab label="Annual Comparison Report" />
          <Tab label="Weather Impact Analysis" />
        </Tabs>
      </Paper>
      
      {/* Filter Section */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        
        <Grid container spacing={3}>
          {/* Market Location Filter (different for each tab) */}
          {activeTab === 2 ? (
            // Location Comparison - Multiple Select
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Market Locations</InputLabel>
                <Select
                  multiple
                  value={selectedLocations}
                  onChange={handleLocationMultiSelect}
                  label="Market Locations"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {marketLocations.map((location) => (
                    <MenuItem key={location.name} value={location.name}>
                      <Checkbox checked={selectedLocations.indexOf(location.name) > -1} />
                      <ListItemText primary={location.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ) : (
            // Other tabs - Single Select for location
            <Grid item xs={12} md={activeTab === 1 ? 3 : activeTab === 3 ? 4 : activeTab === 4 ? 3 : 4}>
              <FormControl fullWidth>
                <InputLabel>Market Location</InputLabel>
                <Select
                  value={selectedLocation}
                  label="Market Location"
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  {marketLocations.map((location) => (
                    <MenuItem key={location.name} value={location.name}>
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          {/* Product Type Filter - Only for Product-wise Report (Tab 1) */}
          {activeTab === 1 && (
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Product Type</InputLabel>
                <Select
                  value={selectedProductType}
                  label="Product Type"
                  onChange={(e) => setSelectedProductType(e.target.value)}
                >
                  {productTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          {/* Month Filter - Not for Annual Comparison */}
          {activeTab !== 3 && (
            <Grid item xs={12} md={activeTab === 1 ? 3 : activeTab === 2 ? 4 : activeTab === 4 ? 3 : 4}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select
                  value={selectedMonth}
                  label="Month"
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {months.map((month) => (
                    <MenuItem key={month} value={month}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          {/* Year Filter - Different for each tab */}
          {activeTab === 3 ? (
            // Annual Comparison - Two Year Selectors
            <>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Year First</InputLabel>
                  <Select
                    value={selectedYearFirst}
                    label="Year First"
                    onChange={(e) => setSelectedYearFirst(e.target.value)}
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year.toString()}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Year Second</InputLabel>
                  <Select
                    value={selectedYearSecond}
                    label="Year Second"
                    onChange={(e) => setSelectedYearSecond(e.target.value)}
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year.toString()}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Month</InputLabel>
                  <Select
                    value={selectedMonth}
                    label="Month"
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {months.map((month) => (
                      <MenuItem key={month} value={month}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          ) : (
            // Other tabs - Single Year Selector
            <Grid item xs={12} md={activeTab === 1 ? 3 : activeTab === 2 ? 4 : activeTab === 4 ? 3 : 4}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={selectedYear}
                  label="Year"
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {years.map((year) => (
                    <MenuItem key={year} value={year.toString()}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          {/* Low Sales Threshold Slider for Weather Impact Report */}
          {activeTab === 4 && (
            <Grid item xs={12} md={3}>
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Low Sales Threshold: {lowSalesThreshold}% of average
                </Typography>
                <Slider
                  value={lowSalesThreshold}
                  onChange={(e, newValue) => setLowSalesThreshold(newValue)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}%`}
                  step={5}
                  marks={[
                    { value: 30, label: '30%' },
                    { value: 50, label: '50%' },
                    { value: 70, label: '70%' },
                  ]}
                  min={20}
                  max={80}
                  sx={{ mt: 2 }}
                />
                <Typography variant="caption" color="textSecondary">
                  Days below this % of average sales are considered "low sales"
                </Typography>
              </Box>
            </Grid>
          )}
          
          {/* Generate Button */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleGenerateReport}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              size="large"
              sx={{ mt: 1 }}
            >
              {loading ? "Generating..." : "Generate Report"}
            </Button>
          </Grid>
        </Grid>
        
        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>
      
      {/* Render Active Report */}
      {activeTab === 0 && renderMonthlySalesReport()}
      {activeTab === 1 && renderProductWiseReport()}
      {activeTab === 2 && renderLocationComparisonReport()}
      {activeTab === 3 && renderAnnualComparisonReport()}
      {activeTab === 4 && renderWeatherImpactReport()}
    </div>
  );
};

export default Reports;