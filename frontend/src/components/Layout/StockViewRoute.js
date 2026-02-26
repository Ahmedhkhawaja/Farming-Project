// components/Layout/StockViewRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const StockViewRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  // Allow both manager and staff
  if (user.role !== "manager" && user.role !== "staff") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default StockViewRoute;
