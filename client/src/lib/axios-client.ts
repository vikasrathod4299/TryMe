import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


axiosClient.interceptors.request.use((config) => {
  const user = localStorage.getItem('user');
  if (user) {
    const { access_token } = JSON.parse(user);
    if (config.headers && access_token) {
      config.headers['Authorization'] = `Bearer ${access_token}`;
    }
  }
  return config;
});

export default axiosClient;
