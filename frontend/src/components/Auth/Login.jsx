import React, { useState } from 'react';
import { 
    Container, 
    Paper, 
    TextField, 
    Button, 
    Typography, 
    Box,
    Alert 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(formData.username, formData.password);
        
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
        
        setLoading(false);
    };

    return (
    <Box
        sx={{
            minHeight: '100vh',
            backgroundImage: `url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
        }}
    >
        {/* Green Overlay */}
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(34, 139, 34, 0.45)'
            }}
        />

        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
            <Paper
                elevation={10}
                sx={{
                    p: 5,
                    borderRadius: 4,
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(255,255,255,0.9)'
                }}
            >
                <Typography
                    variant="h4"
                    align="center"
                    gutterBottom
                    sx={{
                        fontWeight: 'bold',
                        color: '#2e7d32'
                    }}
                >
                    🌾 Farm Fresh Login
                </Typography>

                <Typography
                    variant="body2"
                    align="center"
                    sx={{ mb: 3, color: '#555' }}
                >
                    Welcome back to your farm marketplace
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />

                    <TextField
                        fullWidth
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        sx={{
                            mt: 3,
                            mb: 2,
                            backgroundColor: '#2e7d32',
                            '&:hover': {
                                backgroundColor: '#1b5e20'
                            }
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Enter the Farm'}
                    </Button>
                </form>
            </Paper>
        </Container>
    </Box>
);

};

export default Login;