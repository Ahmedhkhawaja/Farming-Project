import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/Layout/PrivateRoute";
import ManagerRoute from "./components/Layout/ManagerRoute";
import Navbar from "./components/Layout/Navbar";
import Login from "./components/Auth/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import Reports from "./components/Reports/Reports";
import Stocks from "./components/Stocks/Stocks";
import AddStocks from "./components/AddStocks/AddStocks";
import EditStock from "./components/EditStock/EditStock"; // ADD THIS IMPORT
import ReturnStock from "./components/ReturnStock/ReturnStock";
import ProductManagement from "./components/ProductManagement/ProductManagement";

import "./App.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ManagerRoute>
                    <ProductManagement />
                  </ManagerRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <PrivateRoute>
                    <Reports />
                  </PrivateRoute>
                }
              />
              <Route
                path="/stocks"
                element={
                  <PrivateRoute>
                    <Stocks />
                  </PrivateRoute>
                }
              />
              <Route
                path="/add-stocks"
                element={
                  <PrivateRoute>
                    <AddStocks />
                  </PrivateRoute>
                }
              />
              {/* ADD EDIT STOCK ROUTE */}
              <Route
                path="/edit-stocks/:id"
                element={
                  <PrivateRoute>
                    <EditStock />
                  </PrivateRoute>
                }
              />
              {/* ADD RETURN STOCK ROUTE */}
              <Route
                path="/return-stock"
                element={
                  <PrivateRoute>
                    <ReturnStock />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
