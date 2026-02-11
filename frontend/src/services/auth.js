// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem("token");
};

// Set token to localStorage
export const setToken = (token) => {
  localStorage.setItem("token", token);
};

// Remove token from localStorage
export const removeToken = () => {
  localStorage.removeItem("token");
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};
