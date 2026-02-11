import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ManagerRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Only managers can access this route
  if (user.role !== "manager") {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ManagerRoute;
