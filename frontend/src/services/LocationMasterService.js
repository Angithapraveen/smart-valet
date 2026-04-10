
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const LocationMasterService = {
  /**
   * Search for cities
   */
  async searchCities(query, state = '') {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/location-master/cities`, {
      params: { search: query, state },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  /**
   * Get all states
   */
  async getStates() {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/location-master/states`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  /**
   * Get pincodes for city and state
   */
  async getPincodes(city, state) {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/location-master/pincodes`, {
      params: { city, state },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  /**
   * Reverse lookup by pincode
   */
  async getByPincode(pincode) {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/location-master/by-pincode/${pincode}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
