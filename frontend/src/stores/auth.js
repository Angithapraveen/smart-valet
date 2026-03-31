import { defineStore } from 'pinia';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useAuthStore = defineStore('auth', {
  state: () => {
    let token = null;
    let user = null;
    let accessibleLocations = [];
    
    try {
      token = localStorage.getItem('token');
      user = JSON.parse(localStorage.getItem('user') || 'null');
      accessibleLocations = JSON.parse(localStorage.getItem('accessibleLocations') || '[]');
    } catch (e) {
      console.warn('LocalStorage access failed during initialization:', e);
    }
    
    return {
      token,
      user,
      accessibleLocations
    };
  },

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role_name || state.user?.role || null,
    fullname: (state) => state.user?.name || '',
    profileInitial: (state) => (state.user?.name || 'U').charAt(0).toUpperCase(),
    role_name: (state) => state.user?.role_name || state.user?.role || '',
    userLocations: (state) => state.accessibleLocations || [],
    selectedLocationId: (state) => state.user?.selectedLocationId || (state.accessibleLocations?.[0]?.location_id) || null
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
            email_id: response.data.email_id,
            phone_number: response.data.phone_number,
            role_name: response.data.role,
            role: response.data.role,
            role_id: response.data.role_id
          };
          this.accessibleLocations = response.data.accessibleLocations || [];
          
          try {
            localStorage.setItem('token', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));
            localStorage.setItem('accessibleLocations', JSON.stringify(this.accessibleLocations));
          } catch (e) {
            console.warn('Failed to persist auth data to localStorage:', e);
          }

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
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('accessibleLocations');
      } catch (e) {
        console.warn('Failed to clear localStorage during logout:', e);
      }
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
          try {
            localStorage.setItem('user', JSON.stringify(this.user));
            localStorage.setItem('accessibleLocations', JSON.stringify(this.accessibleLocations));
          } catch (e) {
            console.warn('Failed to persist user data to localStorage:', e);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        this.logout();
      }
    }
  }
});
