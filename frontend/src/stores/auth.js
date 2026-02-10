import { defineStore } from 'pinia';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    accessibleLocations: JSON.parse(localStorage.getItem('accessibleLocations') || '[]')
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role_name || state.user?.role || null
  },

  actions: {
    async login(loginId, password) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          login_id: loginId,
          password
        });

        if (response.data.success) {
          this.token = response.data.token;
          this.user = {
            user_id: response.data.user_id,
            name: response.data.name,
            role_name: response.data.role,
            role: response.data.role,
            role_id: response.data.role_id
          };
          // accessibleLocations will be fetched separately if needed

          localStorage.setItem('token', this.token);
          localStorage.setItem('user', JSON.stringify(this.user));

          return {
            success: true,
            role: response.data.role
          };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Login failed'
        };
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      this.accessibleLocations = [];
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('accessibleLocations');
    },

    async fetchCurrentUser() {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${this.token}`
          }
        });

        if (response.data.success) {
          const userData = response.data.data.user;
          this.user = {
            user_id: userData.user_id,
            name: userData.name,
            email_id: userData.email_id,
            phone_number: userData.phone_number,
            role_name: userData.role_name || userData.role,
            role: userData.role_name || userData.role,
            role_id: userData.role_id
          };
          this.accessibleLocations = response.data.data.accessibleLocations || [];
          localStorage.setItem('user', JSON.stringify(this.user));
          localStorage.setItem('accessibleLocations', JSON.stringify(this.accessibleLocations));
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        this.logout();
      }
    }
  }
});
