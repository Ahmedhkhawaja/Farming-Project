import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box 
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar 
      position="static" 
      sx={{ backgroundColor: '#2e7d32' }} // Deep farm green
    >
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, fontWeight: 'bold' }}
        >
          🌾 Farm Fresh
        </Typography>

        {user && (
          <Box>
            <Button 
              sx={{ color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }} 
              component={Link} 
              to="/dashboard"
            >
              Dashboard
            </Button>

            {user.role === "manager" && (
              <Button 
                sx={{ color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }} 
                component={Link} 
                to="/products"
              >
                Products
              </Button>
            )}

            <Button 
              sx={{ color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }} 
              component={Link} 
              to="/add-stocks"
            >
              Add Stocks
            </Button>

            <Button 
              sx={{ color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }} 
              component={Link} 
              to="/reports"
            >
              Reports
            </Button>

            <Button 
              sx={{ color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }} 
              onClick={handleLogout}
            >
              Logout ({user.username})
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
