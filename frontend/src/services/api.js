import axios from "axios";

// Use REACT_APP_API_URL in production (e.g. Vercel), or localhost for dev
const API_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production" ? "/api" : "http://localhost:5000/api");

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["x-auth-token"] = token;
      //config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (userData) => api.post("/auth/login", userData),
  getCurrentUser: () => api.get("/auth/me"),
};

// Product API calls
export const productsAPI = {
  getProducts: () => api.get("/products"),
  getProductTypes: () => api.get("/product-types"),
  getProductCategories: (type) =>
    api.get(`/product-categories?type=${type}`),
  getProductSubCategories: (category) =>
    api.get(`/product-subcategories?category=${category}`),
  createProduct: (data) => api.post("/products", data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  createProductCategory: (data) => api.post("/product-categories", data),
  createProductSubCategory: (data) =>
    api.post("/product-subcategories", data),
};

// Stock API calls - UPDATED VERSION
// In your stockAPI object, add:
// In your api.js, update stockAPI:
export const stockAPI = {
  getAll: () => api.get("/stocks"),
  add: (stockData) => api.post("/stocks", stockData),
  getById: (id) => api.get(`/stocks/${id}`), // NEW
  update: (id, stockData) => api.put(`/stocks/${id}`, stockData), // NEW
  delete: (id) => api.delete(`/stocks/${id}`), // Optional
  getReport: (startDate, endDate) =>
    api.get(`/stocks/report?startDate=${startDate}&endDate=${endDate}`),
  getSummary: () => api.get("/stocks/summary"),

  // Keep old methods for compatibility
  addStock: (stockData) => api.post("/stocks", stockData),
  getAllStocks: () => api.get("/stocks"),
};

// Option 1: If you want to support both naming conventions, keep both
// Option 2: If you want only new names, remove the old ones

export default api;
