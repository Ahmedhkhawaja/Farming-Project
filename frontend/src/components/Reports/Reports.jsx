import React, { useState, useEffect, useRef } from "react";
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
  TextField,
  Slider
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
  ComposedChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine
} from 'recharts';
import api from '../../services/api';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import UmbrellaIcon from '@mui/icons-material/Umbrella';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Add this helper after the imports and before the component
const parseDate = (dateInput) => {
  if (!dateInput) return null;
  let date;
  if (typeof dateInput === 'string') {
    // Try YYYY-MM-DD first (most common)
    const parts = dateInput.split('-').map(Number);
    if (parts.length === 3 && parts.every(p => !isNaN(p))) {
      date = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      date = new Date(dateInput);
    }
  } else if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return null;
  }
  return isNaN(date.getTime()) ? null : date;
};

// Market locations
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

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

const productTypes = ['Greens', 'Kitchen'];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

// Weather icon helpers (original)
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
  const [activeTab, setActiveTab] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(marketLocations[0].name);
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedProductType, setSelectedProductType] = useState('Greens');
  const [selectedLocations, setSelectedLocations] = useState([marketLocations[0].name]);
  const [selectedYearFirst, setSelectedYearFirst] = useState((currentYear - 1).toString());
  const [selectedYearSecond, setSelectedYearSecond] = useState(currentYear.toString());
  const [lowSalesThreshold, setLowSalesThreshold] = useState(50);
  const [weatherImpactData, setWeatherImpactData] = useState([]);
  const [lowSalesDays, setLowSalesDays] = useState([]);
  const [weatherSummary, setWeatherSummary] = useState({
    totalDays: 0,
    lowSalesDaysCount: 0,
    avgSales: 0,
    avgTemp: 0,
    weatherImpact: {}
  });

  // Daily Report states
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [dailyChartData, setDailyChartData] = useState([]);
  const [dailySummary, setDailySummary] = useState({
    totalCategories: 0,
    totalStock: 0,
    totalReturned: 0
  });

  // NEW: Daily Report Both states (including notes)
  const [bothDailyData, setBothDailyData] = useState({
    Greens: [],
    Kitchen: []
  });

  // Add this state near the other bothDaily states (around line 120)
  const [dailyGeneralNote, setDailyGeneralNote] = useState('');

  const [bothDailySummary, setBothDailySummary] = useState({
    Greens: { totalCategories: 0, totalStock: 0, totalReturned: 0 },
    Kitchen: { totalCategories: 0, totalStock: 0, totalReturned: 0 }
  });
  // NEW: Notes for each product type
  const [bothDailyNotes, setBothDailyNotes] = useState({
    Greens: [],
    Kitchen: []
  });

  // Data states for other reports
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const prevActiveTabRef = useRef(activeTab);

/*   // Helper: safely format a YYYY-MM-DD string
  const formatDateString = (dateStr, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', options);
  }; */

  // Replace the existing formatDateString function with this improved version
const formatDateString = (dateInput, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
  const date = parseDate(dateInput);
  if (!date) return dateInput || ''; // fallback to original input if invalid
  return date.toLocaleDateString('en-US', options);
};

  // Helper functions
  const getMonthNumber = (monthName) => months.indexOf(monthName) + 1;

  const getMonthDateRange = (monthName, year) => {
    const monthNumber = getMonthNumber(monthName);
    const yearNum = parseInt(year);
    const startDate = new Date(yearNum, monthNumber - 1, 1);
    const endDate = new Date(yearNum, monthNumber, 0);
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
  };

  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  const handleLocationMultiSelect = (event) => {
    const { value } = event.target;
    setSelectedLocations(typeof value === 'string' ? value.split(',') : value);
  };

  // --- Original report generation functions ---
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
          date: formatDateString(item.date, { month: 'short', day: 'numeric' }),
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

  const generateAnnualComparisonReport = async () => {
    try {
      setLoading(true);
      setError("");
      const firstYearRange = getMonthDateRange(selectedMonth, selectedYearFirst);
      const secondYearRange = getMonthDateRange(selectedMonth, selectedYearSecond);
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
      const processYearData = (data, year) => {
        if (!data || !data.data || data.data.length === 0) {
          return [];
        }
        return data.data.map(item => ({
          date: parseInt(item.date.split('-')[2]),
          day: formatDateString(item.date, { month: 'short', day: 'numeric' }),
          [`sold_${year}`]: item.soldQty || 0,
          [`stock_${year}`]: item.totalStock || 0,
          [`return_${year}`]: item.returnQty || 0
        }));
      };
      const firstYearData = processYearData(firstYearResponse, selectedYearFirst);
      const secondYearData = processYearData(secondYearResponse, selectedYearSecond);
      const mergedData = [];
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
      mergedData.sort((a, b) => a.date - b.date);
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
        const processedData = response.data.map(item => ({
          date: formatDateString(item.date, { month: 'short', day: 'numeric', weekday: 'short' }),
          fullDate: item.date,
          dayOfWeek: new Date(parseInt(item.date.split('-')[0]), parseInt(item.date.split('-')[1]) - 1, parseInt(item.date.split('-')[2])).getDay(),
          soldQty: item.soldQty || 0,
          totalStock: item.totalStock || 0,
          returnQty: item.returnQty || 0,
          weatherCondition: item.weatherCondition || 'Unknown',
          weatherHighTemp: item.weatherHighTemp || null,
          weatherLowTemp: item.weatherLowTemp || null,
          weatherDescription: item.weatherDescription || 'No weather data',
          salesPercentage: item.totalStock > 0 ? ((item.soldQty || 0) / item.totalStock * 100).toFixed(1) : 0
        })).filter(item => item.soldQty > 0);
        setWeatherImpactData(processedData);
        const avgSales = processedData.reduce((sum, item) => sum + item.soldQty, 0) / processedData.length;
        const lowDays = processedData.filter(item => {
          const salesPercentage = (item.soldQty / avgSales) * 100;
          return salesPercentage < lowSalesThreshold;
        });
        setLowSalesDays(lowDays);
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
          if (lowDays.find(day => day.fullDate === item.fullDate)) {
            weatherImpactSummary[condition].lowSalesDays++;
          }
        });
        Object.keys(weatherImpactSummary).forEach(condition => {
          weatherImpactSummary[condition].avgSales =
            weatherImpactSummary[condition].totalSales / weatherImpactSummary[condition].count;
        });
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

  const generateDailyReport = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/reports/product-wise-returns", {
        params: {
          location: selectedLocation,
          productType: selectedProductType,
          startDate: selectedDate,
          endDate: selectedDate
        }
      });
      if (response.data && response.data.length > 0) {
        const categoryMap = new Map();
        response.data.forEach(item => {
          const category = item.category || "Uncategorized";
          if (!categoryMap.has(category)) {
            categoryMap.set(category, { totalStock: 0, returnQty: 0 });
          }
          const catData = categoryMap.get(category);
          catData.totalStock += item.totalStock || 0;
          catData.returnQty += item.returnQty || 0;
        });
        const chartData = Array.from(categoryMap.entries()).map(([category, values]) => ({
          category,
          totalStock: values.totalStock,
          returnQty: values.returnQty
        })).sort((a, b) => b.totalStock - a.totalStock);
        setDailyChartData(chartData);
        const summary = chartData.reduce((acc, cat) => ({
          totalCategories: acc.totalCategories + 1,
          totalStock: acc.totalStock + cat.totalStock,
          totalReturned: acc.totalReturned + cat.returnQty
        }), { totalCategories: 0, totalStock: 0, totalReturned: 0 });
        setDailySummary(summary);
        setSuccess(`Daily report generated for ${selectedLocation} on ${selectedDate} (${selectedProductType})`);
      } else {
        setDailyChartData([]);
        setDailySummary({ totalCategories: 0, totalStock: 0, totalReturned: 0 });
        setSuccess(`No data found for ${selectedLocation} on ${selectedDate} (${selectedProductType})`);
      }
    } catch (err) {
      console.error("Daily report error:", err);
      setError(`Error generating daily report: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Generate Daily Report (Both) with notes
  // Replace the entire generateBothDailyReport function with this:
const generateBothDailyReport = async () => {
  try {
    setLoading(true);
    setError("");

    // Fetch all stock items for the selected date and location
    const response = await api.get("/stocks/daily", {
      params: {
        date: selectedDate,
        location: selectedLocation
      }
    });

    const allItems = response.data || [];

    // Separate by product type
    const greensItems = allItems.filter(item => item.productType === 'Greens');
    const kitchenItems = allItems.filter(item => item.productType === 'Kitchen');

    // Helper to build chart data and summary from items array
    const buildData = (items) => {
      if (items.length === 0) {
        return { chartData: [], summary: { totalCategories: 0, totalStock: 0, totalReturned: 0 } };
      }
      const categoryMap = new Map();
      items.forEach(item => {
        const category = item.productCategory || "Uncategorized";
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { totalStock: 0, returnQty: 0 });
        }
        const catData = categoryMap.get(category);
        catData.totalStock += item.totalStock || 0;
        catData.returnQty += item.returnQty || 0;
      });
      const chartData = Array.from(categoryMap.entries()).map(([category, values]) => ({
        category,
        totalStock: values.totalStock,
        returnQty: values.returnQty
      })).sort((a, b) => b.totalStock - a.totalStock);
      const summary = chartData.reduce((acc, cat) => ({
        totalCategories: acc.totalCategories + 1,
        totalStock: acc.totalStock + cat.totalStock,
        totalReturned: acc.totalReturned + cat.returnQty
      }), { totalCategories: 0, totalStock: 0, totalReturned: 0 });
      return { chartData, summary };
    };

    const greens = buildData(greensItems);
    const kitchen = buildData(kitchenItems);

    setBothDailyData({
      Greens: greens.chartData,
      Kitchen: kitchen.chartData
    });
    setBothDailySummary({
      Greens: greens.summary,
      Kitchen: kitchen.summary
    });

    // Extract the general note from the first item (all share the same note)
    let extractedNote = '';
    if (allItems.length > 0 && allItems[0].notes) {
      const fullNotes = allItems[0].notes;
      // Format: "Weather: ... | Notes: ..." or just "Weather: ..."
      const notesParts = fullNotes.split(' | Notes: ');
      extractedNote = notesParts.length > 1 ? notesParts[1] : '';
    }
    setDailyGeneralNote(extractedNote);

    setSuccess(`Combined daily report generated for ${selectedLocation} on ${selectedDate}`);
  } catch (err) {
    console.error("Both daily report error:", err);
    setError(`Error generating combined daily report: ${err.response?.data?.message || err.message}`);
  } finally {
    setLoading(false);
  }
};

  // Handle generate button
  const handleGenerateReport = () => {
    switch (activeTab) {
      case 0:
        generateMonthlyReport();
        break;
      case 1:
        generateProductReport();
        break;
      case 2:
        generateLocationReport();
        break;
      case 3:
        generateAnnualComparisonReport();
        break;
      case 4:
        generateWeatherReport();
        break;
      case 5:
        generateDailyReport();
        break;
      case 6:
        generateBothDailyReport();
        break;
      default:
        generateMonthlyReport();
    }
  };

  // Auto‑generate reports when switching to their tab (once)
  useEffect(() => {
    if (activeTab === 5 && prevActiveTabRef.current !== 5) {
      generateDailyReport();
    }
    if (activeTab === 6 && prevActiveTabRef.current !== 6) {
      generateBothDailyReport();
    }
    prevActiveTabRef.current = activeTab;
  }, [activeTab]);

  // Auto‑generate monthly report on first load
  useEffect(() => {
    generateMonthlyReport();
  }, []);

  // Clear success/error when tab changes
  useEffect(() => {
    setSuccess("");
    setError("");
  }, [activeTab]);

  // --- EXPORT FUNCTIONS ---
  // ... (existing exports remain exactly as provided) ...

  // Monthly Report (Tab 0)
  const exportMonthlyExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    wsData.push([`Monthly Sales Report - ${selectedLocation} - ${selectedMonth} ${selectedYear}`]);
    wsData.push([]);
    wsData.push(['Summary']);
    wsData.push(['Total Products Quantity', monthlySummary.totalProductsQty]);
    wsData.push(['Total Returned Quantity', monthlySummary.totalReturnedQty]);
    wsData.push(['Total Sold Quantity', monthlySummary.totalSoldQty]);
    wsData.push([]);
    wsData.push(['Date', 'Total Stock', 'Returned Qty', 'Sold Qty']);

    monthlyChartData.forEach(item => {
      wsData.push([item.date, item.totalStock, item.returnQty, item.soldQty]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
    XLSX.writeFile(wb, `Monthly_Report_${selectedLocation}_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const exportMonthlyPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text('Monthly Sales Report', 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`${selectedLocation} - ${selectedMonth} ${selectedYear}`, 14, y);
    y += 10;

    doc.setFontSize(14);
    doc.text('Summary', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total Products Quantity: ${monthlySummary.totalProductsQty}`, 14, y);
    y += 6;
    doc.text(`Total Returned Quantity: ${monthlySummary.totalReturnedQty}`, 14, y);
    y += 6;
    doc.text(`Total Sold Quantity: ${monthlySummary.totalSoldQty}`, 14, y);
    y += 10;

    const tableColumn = ['Date', 'Total Stock', 'Returned Qty', 'Sold Qty'];
    const tableRows = monthlyChartData.map(item => [item.date, item.totalStock, item.returnQty, item.soldQty]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: y,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Monthly_Report_${selectedLocation}_${selectedMonth}_${selectedYear}.pdf`);
  };

  // Product Wise Report (Tab 1)
  const exportProductExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    wsData.push([`Product-wise Report - ${selectedLocation} - ${selectedMonth} ${selectedYear} - Type: ${selectedProductType}`]);
    wsData.push([]);
    wsData.push(['Summary']);
    const totalStock = productWiseData.reduce((acc, p) => acc + p.totalStock, 0);
    const totalReturned = productWiseData.reduce((acc, p) => acc + p.returnQty, 0);
    const totalSold = productWiseData.reduce((acc, p) => acc + p.soldQty, 0);
    wsData.push(['Total Products', productWiseData.length]);
    wsData.push(['Total Stock', totalStock]);
    wsData.push(['Total Returned', totalReturned]);
    wsData.push(['Return Rate', totalStock > 0 ? `${((totalReturned / totalStock) * 100).toFixed(1)}%` : '0%']);
    wsData.push([]);
    wsData.push(['Product Name', 'Total Stock', 'Sold Qty', 'Returned Qty', 'Return Rate (%)', 'Sales Rate (%)']);

    productWiseData.forEach(p => {
      const returnRate = p.totalStock > 0 ? ((p.returnQty / p.totalStock) * 100).toFixed(1) : 0;
      const salesRate = p.totalStock > 0 ? ((p.soldQty / p.totalStock) * 100).toFixed(1) : 0;
      wsData.push([p.productName, p.totalStock, p.soldQty, p.returnQty, returnRate, salesRate]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Product Report');
    XLSX.writeFile(wb, `Product_Report_${selectedLocation}_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const exportProductPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text('Product-wise Report', 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`${selectedLocation} - ${selectedMonth} ${selectedYear} - Type: ${selectedProductType}`, 14, y);
    y += 10;

    const totalStock = productWiseData.reduce((acc, p) => acc + p.totalStock, 0);
    const totalReturned = productWiseData.reduce((acc, p) => acc + p.returnQty, 0);
    const totalSold = productWiseData.reduce((acc, p) => acc + p.soldQty, 0);

    doc.setFontSize(14);
    doc.text('Summary', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total Products: ${productWiseData.length}`, 14, y);
    y += 6;
    doc.text(`Total Stock: ${totalStock}`, 14, y);
    y += 6;
    doc.text(`Total Returned: ${totalReturned}`, 14, y);
    y += 6;
    doc.text(`Return Rate: ${totalStock > 0 ? ((totalReturned / totalStock) * 100).toFixed(1) : 0}%`, 14, y);
    y += 10;

    const tableColumn = ['Product Name', 'Total Stock', 'Sold Qty', 'Returned Qty', 'Return Rate %', 'Sales Rate %'];
    const tableRows = productWiseData.map(p => {
      const returnRate = p.totalStock > 0 ? ((p.returnQty / p.totalStock) * 100).toFixed(1) : 0;
      const salesRate = p.totalStock > 0 ? ((p.soldQty / p.totalStock) * 100).toFixed(1) : 0;
      return [p.productName, p.totalStock, p.soldQty, p.returnQty, returnRate, salesRate];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: y,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Product_Report_${selectedLocation}_${selectedMonth}_${selectedYear}.pdf`);
  };

  // Location Comparison Report (Tab 2)
  const exportLocationExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    wsData.push([`Location Comparison - ${selectedMonth} ${selectedYear}`]);
    wsData.push([]);
    wsData.push(['Location', 'Total Stock', 'Sold Qty', 'Returned Qty', 'Sales %', 'Revenue']);
    locationComparisonData.forEach(loc => {
      wsData.push([loc.location, loc.totalStock, loc.totalSold, loc.totalReturned || 0, loc.salesPercentage, loc.revenue]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Location Comparison');
    XLSX.writeFile(wb, `Location_Comparison_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const exportLocationPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text('Location Comparison Report', 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`${selectedMonth} ${selectedYear}`, 14, y);
    y += 10;

    const tableColumn = ['Location', 'Total Stock', 'Sold Qty', 'Returned Qty', 'Sales %', 'Revenue'];
    const tableRows = locationComparisonData.map(loc => [
      loc.location,
      loc.totalStock,
      loc.totalSold,
      loc.totalReturned || 0,
      loc.salesPercentage,
      loc.revenue
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: y,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Location_Comparison_${selectedMonth}_${selectedYear}.pdf`);
  };

  // Annual Comparison Report (Tab 3)
  const exportAnnualExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    wsData.push([`Annual Comparison - ${selectedLocation} - ${selectedMonth} ${selectedYearFirst} vs ${selectedYearSecond}`]);
    wsData.push([]);
    wsData.push(['Summary']);
    wsData.push([`${selectedYearFirst} Total Sales`, annualComparisonSummary.firstYear.totalSales]);
    wsData.push([`${selectedYearFirst} Avg Sales`, annualComparisonSummary.firstYear.avgSales.toFixed(1)]);
    wsData.push([`${selectedYearSecond} Total Sales`, annualComparisonSummary.secondYear.totalSales]);
    wsData.push([`${selectedYearSecond} Avg Sales`, annualComparisonSummary.secondYear.avgSales.toFixed(1)]);
    wsData.push(['Growth %', annualComparisonSummary.secondYear.growth.toFixed(1)]);
    wsData.push(['Total Days', annualComparisonData.length]);
    wsData.push([]);
    wsData.push(['Day', `${selectedYearFirst} Sales`, `${selectedYearFirst} Stock`, `${selectedYearFirst} Sales %`, `${selectedYearSecond} Sales`, `${selectedYearSecond} Stock`, `${selectedYearSecond} Sales %`, 'Change %']);

    annualComparisonData.forEach(d => {
      const firstSales = d[`sold_${selectedYearFirst}`] || 0;
      const firstStock = d[`stock_${selectedYearFirst}`] || 0;
      const firstSalesPct = firstStock > 0 ? ((firstSales / firstStock) * 100).toFixed(1) : '0.0';
      const secondSales = d[`sold_${selectedYearSecond}`] || 0;
      const secondStock = d[`stock_${selectedYearSecond}`] || 0;
      const secondSalesPct = secondStock > 0 ? ((secondSales / secondStock) * 100).toFixed(1) : '0.0';
      const change = firstSales > 0 ? ((secondSales - firstSales) / firstSales * 100).toFixed(1) : (secondSales > 0 ? '100.0' : '0.0');
      wsData.push([d.day, firstSales, firstStock, firstSalesPct, secondSales, secondStock, secondSalesPct, change]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Annual Comparison');
    XLSX.writeFile(wb, `Annual_Comparison_${selectedLocation}_${selectedMonth}_${selectedYearFirst}_vs_${selectedYearSecond}.xlsx`);
  };

  const exportAnnualPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text('Annual Comparison Report', 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`${selectedLocation} - ${selectedMonth} ${selectedYearFirst} vs ${selectedYearSecond}`, 14, y);
    y += 10;

    doc.setFontSize(14);
    doc.text('Summary', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`${selectedYearFirst} Total Sales: ${annualComparisonSummary.firstYear.totalSales}`, 14, y);
    y += 6;
    doc.text(`${selectedYearFirst} Avg Sales: ${annualComparisonSummary.firstYear.avgSales.toFixed(1)}`, 14, y);
    y += 6;
    doc.text(`${selectedYearSecond} Total Sales: ${annualComparisonSummary.secondYear.totalSales}`, 14, y);
    y += 6;
    doc.text(`${selectedYearSecond} Avg Sales: ${annualComparisonSummary.secondYear.avgSales.toFixed(1)}`, 14, y);
    y += 6;
    doc.text(`Growth: ${annualComparisonSummary.secondYear.growth.toFixed(1)}%`, 14, y);
    y += 6;
    doc.text(`Total Days: ${annualComparisonData.length}`, 14, y);
    y += 10;

    const tableColumn = ['Day', `${selectedYearFirst} Sales`, `${selectedYearFirst} Stock`, `${selectedYearFirst} Sales %`, `${selectedYearSecond} Sales`, `${selectedYearSecond} Stock`, `${selectedYearSecond} Sales %`, 'Change %'];
    const tableRows = annualComparisonData.map(d => {
      const firstSales = d[`sold_${selectedYearFirst}`] || 0;
      const firstStock = d[`stock_${selectedYearFirst}`] || 0;
      const firstSalesPct = firstStock > 0 ? ((firstSales / firstStock) * 100).toFixed(1) : '0.0';
      const secondSales = d[`sold_${selectedYearSecond}`] || 0;
      const secondStock = d[`stock_${selectedYearSecond}`] || 0;
      const secondSalesPct = secondStock > 0 ? ((secondSales / secondStock) * 100).toFixed(1) : '0.0';
      const change = firstSales > 0 ? ((secondSales - firstSales) / firstSales * 100).toFixed(1) : (secondSales > 0 ? '100.0' : '0.0');
      return [d.day, firstSales, firstStock, firstSalesPct, secondSales, secondStock, secondSalesPct, change];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: y,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Annual_Comparison_${selectedLocation}_${selectedMonth}_${selectedYearFirst}_vs_${selectedYearSecond}.pdf`);
  };

  // Weather Impact Report (Tab 4)
  const exportWeatherExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Low Sales Days
    const ws1Data = [];
    ws1Data.push([`Weather Impact Report - ${selectedLocation} - ${selectedMonth} ${selectedYear}`]);
    ws1Data.push([]);
    ws1Data.push(['Summary']);
    ws1Data.push(['Total Market Days', weatherSummary.totalDays]);
    ws1Data.push(['Low Sales Days', weatherSummary.lowSalesDaysCount]);
    ws1Data.push(['Average Sales', weatherSummary.avgSales.toFixed(1)]);
    ws1Data.push(['Average Temperature', weatherSummary.avgTemp.toFixed(1)]);
    ws1Data.push([]);
    ws1Data.push(['Low Sales Days Details']);
    ws1Data.push(['Date', 'Day', 'Sold Qty', 'Total Stock', 'Sales %', 'Weather Condition', 'High Temp', 'Low Temp', 'Description', 'Impact']);

    lowSalesDays.forEach(day => {
      const salesPercentage = (day.soldQty / weatherSummary.avgSales) * 100;
      const impact = salesPercentage < 30 ? 'Critical' : 'Low';
      ws1Data.push([
        day.date,
        day.date.split(',')[0],
        day.soldQty,
        day.totalStock,
        day.salesPercentage,
        day.weatherCondition,
        day.weatherHighTemp || 'N/A',
        day.weatherLowTemp || 'N/A',
        day.weatherDescription,
        impact
      ]);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
    XLSX.utils.book_append_sheet(wb, ws1, 'Low Sales Days');

    // Sheet 2: Weather Impact Summary
    const ws2Data = [];
    ws2Data.push(['Weather Impact Summary']);
    ws2Data.push(['Condition', 'Days', 'Avg Sales', 'Low Sales Days', 'Low Sales Rate %']);

    Object.entries(weatherSummary.weatherImpact).forEach(([condition, data]) => {
      const lowRate = data.count > 0 ? ((data.lowSalesDays / data.count) * 100).toFixed(1) : 0;
      ws2Data.push([condition, data.count, data.avgSales.toFixed(1), data.lowSalesDays, lowRate]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
    XLSX.utils.book_append_sheet(wb, ws2, 'Weather Summary');

    XLSX.writeFile(wb, `Weather_Report_${selectedLocation}_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const exportWeatherPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text('Weather Impact Report', 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`${selectedLocation} - ${selectedMonth} ${selectedYear}`, 14, y);
    y += 10;

    doc.setFontSize(14);
    doc.text('Summary', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total Market Days: ${weatherSummary.totalDays}`, 14, y);
    y += 6;
    doc.text(`Low Sales Days: ${weatherSummary.lowSalesDaysCount}`, 14, y);
    y += 6;
    doc.text(`Average Sales: ${weatherSummary.avgSales.toFixed(1)}`, 14, y);
    y += 6;
    doc.text(`Average Temperature: ${weatherSummary.avgTemp.toFixed(1)}°C`, 14, y);
    y += 10;

    if (lowSalesDays.length > 0) {
      doc.setFontSize(14);
      doc.text('Low Sales Days Details', 14, y);
      y += 8;

      const tableColumn = ['Date', 'Day', 'Sold Qty', 'Total Stock', 'Sales %', 'Weather', 'High Temp', 'Low Temp', 'Impact'];
      const tableRows = lowSalesDays.map(day => {
        const salesPercentage = (day.soldQty / weatherSummary.avgSales) * 100;
        const impact = salesPercentage < 30 ? 'Critical' : 'Low';
        return [
          day.date,
          day.date.split(',')[0],
          day.soldQty,
          day.totalStock,
          day.salesPercentage,
          day.weatherCondition,
          day.weatherHighTemp || 'N/A',
          day.weatherLowTemp || 'N/A',
          impact
        ];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: y,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { top: y },
      });

      y = doc.lastAutoTable.finalY + 10;

      // Weather Impact Summary
      doc.setFontSize(14);
      doc.text('Weather Impact Summary', 14, y);
      y += 8;

      const summaryColumn = ['Condition', 'Days', 'Avg Sales', 'Low Sales Days', 'Low Sales Rate %'];
      const summaryRows = Object.entries(weatherSummary.weatherImpact).map(([condition, data]) => {
        const lowRate = data.count > 0 ? ((data.lowSalesDays / data.count) * 100).toFixed(1) : 0;
        return [condition, data.count, data.avgSales.toFixed(1), data.lowSalesDays, lowRate];
      });

      autoTable(doc, {
        head: [summaryColumn],
        body: summaryRows,
        startY: y,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
      });
    } else {
      doc.text('No low sales days found.', 14, y);
    }

    doc.save(`Weather_Report_${selectedLocation}_${selectedMonth}_${selectedYear}.pdf`);
  };

  // Daily Report (Tab 5)
  const exportDailyExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    wsData.push([`Daily Report - ${selectedLocation} - ${selectedDate} - Type: ${selectedProductType}`]);
    wsData.push([]);
    wsData.push(['Summary']);
    wsData.push(['Total Categories', dailySummary.totalCategories]);
    wsData.push(['Total Stock', dailySummary.totalStock]);
    wsData.push(['Total Returned', dailySummary.totalReturned]);
    wsData.push([]);
    wsData.push(['Category', 'Total Stock', 'Returned Qty']);

    dailyChartData.forEach(cat => {
      wsData.push([cat.category, cat.totalStock, cat.returnQty]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Daily Report');
    XLSX.writeFile(wb, `Daily_Report_${selectedLocation}_${selectedDate}.xlsx`);
  };

  const exportDailyPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text('Daily Report', 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`${selectedLocation} - ${formatDateString(selectedDate)} - Type: ${selectedProductType}`, 14, y);
    y += 10;

    doc.setFontSize(14);
    doc.text('Summary', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total Categories: ${dailySummary.totalCategories}`, 14, y);
    y += 6;
    doc.text(`Total Stock: ${dailySummary.totalStock}`, 14, y);
    y += 6;
    doc.text(`Total Returned: ${dailySummary.totalReturned}`, 14, y);
    y += 10;

    const tableColumn = ['Category', 'Total Stock', 'Returned Qty'];
    const tableRows = dailyChartData.map(cat => [cat.category, cat.totalStock, cat.returnQty]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: y,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Daily_Report_${selectedLocation}_${selectedDate}.pdf`);
  };

  // NEW: Daily Report Both exports
  const exportBothDailyExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    wsData.push([`Combined Daily Report - ${selectedLocation} - ${selectedDate}`]);
    wsData.push([]);
    wsData.push(['Greens Summary']);
    wsData.push(['Total Categories', bothDailySummary.Greens.totalCategories]);
    wsData.push(['Total Stock', bothDailySummary.Greens.totalStock]);
    wsData.push(['Total Returned', bothDailySummary.Greens.totalReturned]);
    wsData.push([]);
    wsData.push(['Greens Categories', 'Total Stock', 'Returned Qty']);
    bothDailyData.Greens.forEach(cat => {
      wsData.push([cat.category, cat.totalStock, cat.returnQty]);
    });
    wsData.push([]);
    wsData.push(['Kitchen Summary']);
    wsData.push(['Total Categories', bothDailySummary.Kitchen.totalCategories]);
    wsData.push(['Total Stock', bothDailySummary.Kitchen.totalStock]);
    wsData.push(['Total Returned', bothDailySummary.Kitchen.totalReturned]);
    wsData.push([]);
    wsData.push(['Kitchen Categories', 'Total Stock', 'Returned Qty']);
    bothDailyData.Kitchen.forEach(cat => {
      wsData.push([cat.category, cat.totalStock, cat.returnQty]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Combined Daily Report');
    XLSX.writeFile(wb, `Both_Daily_Report_${selectedLocation}_${selectedDate}.xlsx`);
  };

  const exportBothDailyPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(16);
    doc.text('Combined Daily Report', 14, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`${selectedLocation} - ${formatDateString(selectedDate)}`, 14, y);
    y += 10;

    // Greens section
    doc.setFontSize(14);
    doc.text('Greens', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total Categories: ${bothDailySummary.Greens.totalCategories}`, 14, y);
    y += 6;
    doc.text(`Total Stock: ${bothDailySummary.Greens.totalStock}`, 14, y);
    y += 6;
    doc.text(`Total Returned: ${bothDailySummary.Greens.totalReturned}`, 14, y);
    y += 10;

    const greensTableColumn = ['Category', 'Total Stock', 'Returned Qty'];
    const greensTableRows = bothDailyData.Greens.map(cat => [cat.category, cat.totalStock, cat.returnQty]);

    autoTable(doc, {
      head: [greensTableColumn],
      body: greensTableRows,
      startY: y,
      theme: 'striped',
      headStyles: { fillColor: [76, 175, 80] }, // Green
    });

    y = doc.lastAutoTable.finalY + 10;

    // Kitchen section
    doc.setFontSize(14);
    doc.text('Kitchen', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total Categories: ${bothDailySummary.Kitchen.totalCategories}`, 14, y);
    y += 6;
    doc.text(`Total Stock: ${bothDailySummary.Kitchen.totalStock}`, 14, y);
    y += 6;
    doc.text(`Total Returned: ${bothDailySummary.Kitchen.totalReturned}`, 14, y);
    y += 10;

    const kitchenTableColumn = ['Category', 'Total Stock', 'Returned Qty'];
    const kitchenTableRows = bothDailyData.Kitchen.map(cat => [cat.category, cat.totalStock, cat.returnQty]);

    autoTable(doc, {
      head: [kitchenTableColumn],
      body: kitchenTableRows,
      startY: y,
      theme: 'striped',
      headStyles: { fillColor: [255, 152, 0] }, // Orange
    });

    doc.save(`Both_Daily_Report_${selectedLocation}_${selectedDate}.pdf`);
  };

  // Main export handlers
  const handleExportPDF = () => {
    if (loading) return;
    let hasData = true;
    switch (activeTab) {
      case 0: hasData = monthlyChartData.length > 0 || monthlySummary.totalProductsQty > 0; break;
      case 1: hasData = productWiseData.length > 0; break;
      case 2: hasData = locationComparisonData.length > 0; break;
      case 3: hasData = annualComparisonData.length > 0; break;
      case 4: hasData = weatherImpactData.length > 0 || lowSalesDays.length > 0; break;
      case 5: hasData = dailyChartData.length > 0 || dailySummary.totalCategories > 0; break;
      case 6: hasData = bothDailyData.Greens.length > 0 || bothDailyData.Kitchen.length > 0; break;
      default: hasData = false;
    }
    if (!hasData) {
      alert('No data to export. Please generate a report first.');
      return;
    }

    switch (activeTab) {
      case 0: exportMonthlyPDF(); break;
      case 1: exportProductPDF(); break;
      case 2: exportLocationPDF(); break;
      case 3: exportAnnualPDF(); break;
      case 4: exportWeatherPDF(); break;
      case 5: exportDailyPDF(); break;
      case 6: exportBothDailyPDF(); break;
      default: break;
    }
  };

  const handleExportExcel = () => {
    if (loading) return;
    let hasData = true;
    switch (activeTab) {
      case 0: hasData = monthlyChartData.length > 0 || monthlySummary.totalProductsQty > 0; break;
      case 1: hasData = productWiseData.length > 0; break;
      case 2: hasData = locationComparisonData.length > 0; break;
      case 3: hasData = annualComparisonData.length > 0; break;
      case 4: hasData = weatherImpactData.length > 0 || lowSalesDays.length > 0; break;
      case 5: hasData = dailyChartData.length > 0 || dailySummary.totalCategories > 0; break;
      case 6: hasData = bothDailyData.Greens.length > 0 || bothDailyData.Kitchen.length > 0; break;
      default: hasData = false;
    }
    if (!hasData) {
      alert('No data to export. Please generate a report first.');
      return;
    }

    switch (activeTab) {
      case 0: exportMonthlyExcel(); break;
      case 1: exportProductExcel(); break;
      case 2: exportLocationExcel(); break;
      case 3: exportAnnualExcel(); break;
      case 4: exportWeatherExcel(); break;
      case 5: exportDailyExcel(); break;
      case 6: exportBothDailyExcel(); break;
      default: break;
    }
  };

  // --- Render functions ---
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
            <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading chart data...</Typography>
            </Box>
          ) : productWiseData.length > 0 ? (
            <>
              <Box sx={{ width: '100%', height: 400, mb: 3 }}>
                <ResponsiveContainer>
                  <BarChart data={productWiseData.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productName" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
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
                        <Typography fontWeight="bold" color="error">Returned Qty</Typography>
                      </TableCell>
                      <TableCell align="right">Return Rate</TableCell>
                      <TableCell align="right">Sales Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productWiseData.map((product, index) => {
                      const returnRate = product.totalStock > 0 ? ((product.returnQty / product.totalStock) * 100).toFixed(1) : 0;
                      const salesRate = product.totalStock > 0 ? ((product.soldQty / product.totalStock) * 100).toFixed(1) : 0;
                      return (
                        <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f5f5f5' }, ...(index < 3 ? { backgroundColor: '#fff8e8' } : {}) }}>
                          <TableCell>
                            <Chip label={index + 1} size="small" color={index === 0 ? "error" : index === 1 ? "warning" : index === 2 ? "info" : "default"} sx={{ fontWeight: 'bold' }} />
                          </TableCell>
                          <TableCell><Typography fontWeight={index < 3 ? "bold" : "normal"}>{product.productName}</Typography></TableCell>
                          <TableCell align="right">{product.totalStock}</TableCell>
                          <TableCell align="right">{product.soldQty}</TableCell>
                          <TableCell align="right" sx={{ backgroundColor: '#ffeeee' }}><Typography fontWeight="bold" color="error">{product.returnQty || 0}</Typography></TableCell>
                          <TableCell align="right"><Chip label={`${returnRate}%`} size="small" color={returnRate > 20 ? "error" : returnRate > 10 ? "warning" : "success"} variant="outlined" /></TableCell>
                          <TableCell align="right">{salesRate}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography color="textSecondary">No product data available for the selected filters.</Typography>
            </Box>
          )}
        </Paper>
      </>
    );
  };

  const renderLocationComparisonReport = () => (
    <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Location Comparison - {selectedMonth} {selectedYear}
        <Typography variant="body2" color="textSecondary">Selected Locations: {selectedLocations.length}</Typography>
      </Typography>
      {locationComparisonData.length > 0 ? (
        <>
          <Box sx={{ width: '100%', height: 400, mb: 3 }}>
            <ResponsiveContainer>
              <BarChart data={locationComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar name="Total Stock" dataKey="totalStock" fill="#8884d8" />
                <Bar name="Sold Qty" dataKey="totalSold" fill="#82ca9d" />
                <Bar name="Returned Qty" dataKey="totalReturned" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
          <TableContainer>
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
                    <TableCell align="right">{location.salesPercentage ? `${location.salesPercentage}%` : '0%'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="textSecondary">No location comparison data available</Typography>
        </Box>
      )}
    </Paper>
  );

  const renderAnnualComparisonReport = () => (
    <>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>{selectedYearFirst} Total Sales</Typography>
              <Typography variant="h4" component="div" color="info.main">{annualComparisonSummary.firstYear.totalSales.toLocaleString()}</Typography>
              <Typography variant="body2" color="textSecondary">Avg: {annualComparisonSummary.firstYear.avgSales.toFixed(1)}/day</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>{selectedYearSecond} Total Sales</Typography>
              <Typography variant="h4" component="div" color="success.main">{annualComparisonSummary.secondYear.totalSales.toLocaleString()}</Typography>
              <Typography variant="body2" color="textSecondary">Avg: {annualComparisonSummary.secondYear.avgSales.toFixed(1)}/day</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Growth</Typography>
              <Typography variant="h4" component="div" color={annualComparisonSummary.secondYear.growth >= 0 ? "success.main" : "error"}>
                {annualComparisonSummary.secondYear.growth >= 0 ? '+' : ''}{annualComparisonSummary.secondYear.growth.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">{selectedYearFirst} → {selectedYearSecond}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Days Compared</Typography>
              <Typography variant="h4" component="div">{annualComparisonData.length}</Typography>
              <Typography variant="body2" color="textSecondary">Month: {selectedMonth}</Typography>
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
                  <Area type="monotone" dataKey={`stock_${selectedYearFirst}`} fill="#e0f7fa" stroke="#80deea" name={`${selectedYearFirst} Stock`} opacity={0.6} />
                  <Area type="monotone" dataKey={`stock_${selectedYearSecond}`} fill="#f3e5f5" stroke="#ce93d8" name={`${selectedYearSecond} Stock`} opacity={0.6} />
                  <Bar dataKey={`sold_${selectedYearFirst}`} fill="#0088FE" name={`${selectedYearFirst} Sales`} />
                  <Bar dataKey={`sold_${selectedYearSecond}`} fill="#00C49F" name={`${selectedYearSecond} Sales`} />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Daily Sales Comparison Table</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Day</TableCell>
                    <TableCell align="right" sx={{ backgroundColor: '#e8f4fd' }}>{selectedYearFirst} Sales</TableCell>
                    <TableCell align="right" sx={{ backgroundColor: '#e8f4fd' }}>{selectedYearFirst} Stock</TableCell>
                    <TableCell align="right" sx={{ backgroundColor: '#e8f4fd' }}>{selectedYearFirst} Sales %</TableCell>
                    <TableCell align="right" sx={{ backgroundColor: '#e8f5e8' }}>{selectedYearSecond} Sales</TableCell>
                    <TableCell align="right" sx={{ backgroundColor: '#e8f5e8' }}>{selectedYearSecond} Stock</TableCell>
                    <TableCell align="right" sx={{ backgroundColor: '#e8f5e8' }}>{selectedYearSecond} Sales %</TableCell>
                    <TableCell align="right">Change</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {annualComparisonData.map((dayData, index) => {
                    const firstYearSales = dayData[`sold_${selectedYearFirst}`] || 0;
                    const secondYearSales = dayData[`sold_${selectedYearSecond}`] || 0;
                    const firstYearStock = dayData[`stock_${selectedYearFirst}`] || 0;
                    const secondYearStock = dayData[`stock_${selectedYearSecond}`] || 0;
                    const firstYearSalesRate = firstYearStock > 0 ? ((firstYearSales / firstYearStock) * 100).toFixed(1) : '0.0';
                    const secondYearSalesRate = secondYearStock > 0 ? ((secondYearSales / secondYearStock) * 100).toFixed(1) : '0.0';
                    const change = firstYearSales > 0 ? ((secondYearSales - firstYearSales) / firstYearSales * 100).toFixed(1) : secondYearSales > 0 ? '100.0' : '0.0';
                    return (
                      <TableRow key={index} hover>
                        <TableCell><Typography fontWeight="medium">{dayData.day}</Typography></TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#f5faff' }}>{firstYearSales}</TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#f5faff' }}>{firstYearStock}</TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#f5faff' }}>{firstYearSalesRate}%</TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#f5fff5' }}>{secondYearSales}</TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#f5fff5' }}>{secondYearStock}</TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#f5fff5' }}>{secondYearSalesRate}%</TableCell>
                        <TableCell align="right"><Chip label={`${parseFloat(change) >= 0 ? '+' : ''}${change}%`} size="small" color={parseFloat(change) > 0 ? "success" : parseFloat(change) < 0 ? "error" : "default"} variant="outlined" /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="textSecondary">No annual comparison data available. Select years and generate report.</Typography>
          </Box>
        )}
      </Paper>
    </>
  );

  const renderWeatherImpactReport = () => (
    <>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Market Days</Typography>
              <Typography variant="h4" component="div">{weatherSummary.totalDays}</Typography>
              <Typography variant="body2" color="textSecondary">{selectedMonth} {selectedYear}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Low Sales Days</Typography>
              <Typography variant="h4" component="div" color="error">{weatherSummary.lowSalesDaysCount}</Typography>
              <Typography variant="body2" color="textSecondary">Below {lowSalesThreshold}% of average</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Average Sales</Typography>
              <Typography variant="h4" component="div" color="success.main">{weatherSummary.avgSales.toFixed(1)}</Typography>
              <Typography variant="body2" color="textSecondary">Per day average</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Average Temperature</Typography>
              <Typography variant="h4" component="div" color="info.main">{weatherSummary.avgTemp.toFixed(1)}°C</Typography>
              <Typography variant="body2" color="textSecondary">High/Low average</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Days with Very Low Sales & Weather Analysis</Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Showing days where sales were below {lowSalesThreshold}% of the monthly average. Weather data is captured from AddStock entries.
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
                      <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f9f9f9' }, ...(isCritical ? { backgroundColor: '#fff0f0' } : {}) }}>
                        <TableCell><Typography fontWeight="medium">{day.date}</Typography></TableCell>
                        <TableCell><Chip label={day.date.split(',')[0]} size="small" variant="outlined" /></TableCell>
                        <TableCell align="right"><Typography color={isCritical ? "error" : "warning.main"} fontWeight="bold">{day.soldQty}</Typography><Typography variant="caption" color="textSecondary">{((day.soldQty / weatherSummary.avgSales) * 100).toFixed(0)}% of avg</Typography></TableCell>
                        <TableCell align="right">{day.totalStock}</TableCell>
                        <TableCell align="right"><Chip label={`${day.salesPercentage}%`} size="small" color={day.salesPercentage < 50 ? "error" : "warning"} /></TableCell>
                        <TableCell align="center"><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>{getWeatherIcon(day.weatherCondition)}<Typography variant="body2">{day.weatherCondition}</Typography></Box></TableCell>
                        <TableCell align="right">{day.weatherHighTemp ? `${day.weatherHighTemp}°C` : 'N/A'}</TableCell>
                        <TableCell align="right">{day.weatherLowTemp ? `${day.weatherLowTemp}°C` : 'N/A'}</TableCell>
                        <TableCell><Typography variant="body2" color="textSecondary">{day.weatherDescription}</Typography></TableCell>
                        <TableCell align="center">{isCritical ? <Chip icon={<ErrorOutlineIcon />} label="Critical" size="small" color="error" variant="outlined" /> : <Chip label="Low" size="small" color="warning" variant="outlined" />}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Weather Impact Summary</Typography>
              <Grid container spacing={2}>
                {Object.entries(weatherSummary.weatherImpact).map(([condition, data]) => (
                  <Grid item xs={12} sm={6} md={4} key={condition}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: getWeatherImpactColor(condition), display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 1 }}>{getWeatherIcon(condition)}</Box>
                          <Typography variant="subtitle1" fontWeight="bold">{condition}</Typography>
                        </Box>
                        <Grid container spacing={1}>
                          <Grid item xs={6}><Typography variant="caption" color="textSecondary">Days</Typography><Typography variant="body2">{data.count}</Typography></Grid>
                          <Grid item xs={6}><Typography variant="caption" color="textSecondary">Avg Sales</Typography><Typography variant="body2" color="primary">{data.avgSales.toFixed(1)}</Typography></Grid>
                          <Grid item xs={6}><Typography variant="caption" color="textSecondary">Low Sales Days</Typography><Typography variant="body2" color={data.lowSalesDays > 0 ? "error" : "success"}>{data.lowSalesDays}</Typography></Grid>
                          <Grid item xs={6}><Typography variant="caption" color="textSecondary">Low Sales Rate</Typography><Typography variant="body2" color={data.lowSalesDays > 0 ? "error" : "success"}>{data.count > 0 ? ((data.lowSalesDays / data.count) * 100).toFixed(0) : 0}%</Typography></Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </>
        ) : weatherImpactData.length > 0 ? (
          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" color="success.main">Great news! No low sales days found.</Typography>
            <Typography color="textSecondary">All sales days were above {lowSalesThreshold}% of the monthly average.</Typography>
          </Box>
        ) : (
          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="textSecondary">No weather impact data available. Select location, month, year and generate report.</Typography>
          </Box>
        )}
      </Paper>
      {weatherImpactData.length > 0 && (
        <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Sales vs Weather Conditions: {selectedLocation} - {selectedMonth} {selectedYear}</Typography>
          <Box sx={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" name="Date" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
                <YAxis dataKey="soldQty" name="Sales Quantity" label={{ value: 'Sales Quantity', angle: -90, position: 'insideLeft', offset: -10 }} />
                <ZAxis dataKey="weatherCondition" name="Weather Condition" range={[100, 400]} />
                <Tooltip formatter={(value, name, props) => {
                  if (name === 'soldQty') return [value, 'Sales Quantity'];
                  if (name === 'weatherCondition') return [value, 'Weather'];
                  return [value, name];
                }} content={({ active, payload }) => {
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
                }} />
                <Legend />
                <ReferenceLine y={weatherSummary.avgSales} stroke="#8884d8" strokeDasharray="3 3" label={{ value: `Avg: ${weatherSummary.avgSales.toFixed(1)}`, position: 'right', fill: '#8884d8' }} />
                <Scatter name="Sales by Weather" data={weatherImpactData} fill="#8884d8" shape={(props) => {
                  const { cx, cy, payload } = props;
                  const color = getWeatherImpactColor(payload.weatherCondition);
                  return <circle cx={cx} cy={cy} r={8} fill={color} stroke="#333" strokeWidth={1} />;
                }} />
              </ScatterChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}
    </>
  );

  const renderDailyReport = () => (
    <>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Categories</Typography>
              <Typography variant="h4" component="div">{dailySummary.totalCategories}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Stock</Typography>
              <Typography variant="h4" component="div">{dailySummary.totalStock}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Returned</Typography>
              <Typography variant="h4" component="div" color="error">{dailySummary.totalReturned}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {selectedProductType} Categories – Stock and Returns on {formatDateString(selectedDate)}
        </Typography>
        {dailyChartData.length > 0 ? (
          <Box sx={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar name="Total Stock" dataKey="totalStock" fill="#8884d8" />
                <Bar name="Returned" dataKey="returnQty" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="textSecondary">No data available for this date</Typography>
          </Box>
        )}
      </Paper>
    </>
  );

  // NEW: Render Both Daily Report with notes
  const renderBothDailyReport = () => (
    <>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#e8f5e8' }}>
            <CardContent>
              <Typography variant="h6" color="success.main" gutterBottom>Greens Summary</Typography>
              <Typography>Total Categories: {bothDailySummary.Greens.totalCategories}</Typography>
              <Typography>Total Stock: {bothDailySummary.Greens.totalStock}</Typography>
              <Typography color="error">Total Returned: {bothDailySummary.Greens.totalReturned}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ backgroundColor: '#fff3e0' }}>
            <CardContent>
              <Typography variant="h6" color="warning.main" gutterBottom>Kitchen Summary</Typography>
              <Typography>Total Categories: {bothDailySummary.Kitchen.totalCategories}</Typography>
              <Typography>Total Stock: {bothDailySummary.Kitchen.totalStock}</Typography>
              <Typography color="error">Total Returned: {bothDailySummary.Kitchen.totalReturned}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Greens Categories – Stock and Returns on {formatDateString(selectedDate)}</Typography>
        {bothDailyData.Greens.length > 0 ? (
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={bothDailyData.Greens}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar name="Total Stock" dataKey="totalStock" fill="#4caf50" />
                <Bar name="Returned" dataKey="returnQty" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="textSecondary">No Greens data available for this date</Typography>
          </Box>
        )}
      </Paper>

      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Kitchen Categories – Stock and Returns on {formatDateString(selectedDate)}</Typography>
        {bothDailyData.Kitchen.length > 0 ? (
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={bothDailyData.Kitchen}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar name="Total Stock" dataKey="totalStock" fill="#ff9800" />
                <Bar name="Returned" dataKey="returnQty" fill="#ff7300" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="textSecondary">No Kitchen data available for this date</Typography>
          </Box>
        )}
      </Paper>

      {/* NEW: Notes section */}

<Paper elevation={1} sx={{ p: 3, mb: 3 }}>
  <Typography variant="h6" gutterBottom>Notes added while Adding Stocks</Typography>
  {dailyGeneralNote ? (
    <Typography variant="body1" sx={{ fontStyle: 'italic', backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
      {dailyGeneralNote}
    </Typography>
  ) : (
    <Typography color="textSecondary">No notes added for this day!</Typography>
  )}
</Paper>
    </>
  );

  return (
    <div className="reports-container" style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, color: '#2c3e50', fontWeight: 600 }}>
        Reports Dashboard
      </Typography>
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Monthly Sales Report" />
          <Tab label="Product-wise Report" />
          <Tab label="Location Comparison" />
          <Tab label="Annual Comparison Report" />
          <Tab label="Weather Impact Analysis" />
          <Tab label="Daily Report" />
          <Tab label="Daily Report (Both)" />
        </Tabs>
      </Paper>
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filters</Typography>
        <Grid container spacing={3}>
          {activeTab === 2 ? (
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Market Locations</InputLabel>
                <Select multiple value={selectedLocations} onChange={handleLocationMultiSelect} label="Market Locations" renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                  </Box>
                )}>
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
            <Grid item xs={12} md={activeTab === 1 ? 3 : activeTab === 3 ? 4 : activeTab === 4 ? 3 : activeTab === 5 ? 4 : activeTab === 6 ? 4 : 4}>
              <FormControl fullWidth>
                <InputLabel>Market Location</InputLabel>
                <Select value={selectedLocation} label="Market Location" onChange={(e) => setSelectedLocation(e.target.value)}>
                  {marketLocations.map((location) => <MenuItem key={location.name} value={location.name}>{location.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          )}
          {(activeTab === 1 || activeTab === 5) && (
            <Grid item xs={12} md={activeTab === 1 ? 3 : 4}>
              <FormControl fullWidth>
                <InputLabel>Product Type</InputLabel>
                <Select value={selectedProductType} label="Product Type" onChange={(e) => setSelectedProductType(e.target.value)}>
                  {productTypes.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          )}
          {activeTab !== 3 && activeTab !== 5 && activeTab !== 6 && (
            <Grid item xs={12} md={activeTab === 1 ? 3 : activeTab === 2 ? 4 : activeTab === 4 ? 3 : 4}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(e.target.value)}>
                  {months.map((month) => <MenuItem key={month} value={month}>{month}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          )}
          {activeTab !== 3 && activeTab !== 5 && activeTab !== 6 && (
            <Grid item xs={12} md={activeTab === 1 ? 3 : activeTab === 2 ? 4 : activeTab === 4 ? 3 : 4}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(e.target.value)}>
                  {years.map((year) => <MenuItem key={year} value={year.toString()}>{year}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          )}
          {activeTab === 3 && (
            <>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Year First</InputLabel>
                  <Select value={selectedYearFirst} label="Year First" onChange={(e) => setSelectedYearFirst(e.target.value)}>
                    {years.map((year) => <MenuItem key={year} value={year.toString()}>{year}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Year Second</InputLabel>
                  <Select value={selectedYearSecond} label="Year Second" onChange={(e) => setSelectedYearSecond(e.target.value)}>
                    {years.map((year) => <MenuItem key={year} value={year.toString()}>{year}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Month</InputLabel>
                  <Select value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(e.target.value)}>
                    {months.map((month) => <MenuItem key={month} value={month}>{month}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
          {(activeTab === 5 || activeTab === 6) && (
            <Grid item xs={12} md={4}>
              <TextField label="Date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            </Grid>
          )}
          {activeTab === 4 && (
            <Grid item xs={12} md={3}>
              <Box>
                <Typography variant="body2" color="textSecondary" gutterBottom>Low Sales Threshold: {lowSalesThreshold}% of average</Typography>
                <Slider value={lowSalesThreshold} onChange={(e, newValue) => setLowSalesThreshold(newValue)} valueLabelDisplay="auto" valueLabelFormat={(value) => `${value}%`} step={5} marks={[{ value: 30, label: '30%' }, { value: 50, label: '50%' }, { value: 70, label: '70%' }]} min={20} max={80} sx={{ mt: 2 }} />
                <Typography variant="caption" color="textSecondary">Days below this % of average sales are considered "low sales"</Typography>
              </Box>
            </Grid>
          )}
          <Grid item xs={12} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button variant="contained" onClick={handleGenerateReport} disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : null} size="large">
              {loading ? "Generating..." : "Generate Report"}
            </Button>
            <Button variant="outlined" onClick={handleExportPDF} disabled={loading} size="large">
              Export PDF
            </Button>
            <Button variant="outlined" onClick={handleExportExcel} disabled={loading} size="large">
              Export Excel
            </Button>
          </Grid>
        </Grid>
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      {activeTab === 0 && renderMonthlySalesReport()}
      {activeTab === 1 && renderProductWiseReport()}
      {activeTab === 2 && renderLocationComparisonReport()}
      {activeTab === 3 && renderAnnualComparisonReport()}
      {activeTab === 4 && renderWeatherImpactReport()}
      {activeTab === 5 && renderDailyReport()}
      {activeTab === 6 && renderBothDailyReport()}
    </div>
  );
};

export default Reports;