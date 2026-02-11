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
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Grocery Sales Dashboard
        </Typography>

        {user && (
          <Box>
            <Button color="inherit" component={Link} to="/dashboard">
              Dashboard
            </Button>

            <Button color="inherit" component={Link} to="/products">
              Products
            </Button>

            <Button color="inherit" component={Link} to="/add-stocks">
              Add Stocks
            </Button>

            <Button color="inherit" component={Link} to="/reports">
              Reports
            </Button>

            <Button color="inherit" onClick={handleLogout}>
              Logout ({user.username})
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
