import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`
  };
};

export const SubscriptionService = {
  // Admin APIs
  async createPlan(planData) {
    const response = await axios.post(`${API_BASE_URL}/admin/subscriptions/plans`, planData, {
      headers: getHeaders()
    });
    return response.data;
  },

  async getPlans() {
    const response = await axios.get(`${API_BASE_URL}/admin/subscriptions/plans`, {
      headers: getHeaders()
    });
    return response.data;
  },

  async updatePlanStatus(planId, status) {
    const response = await axios.patch(`${API_BASE_URL}/admin/subscriptions/plans/${planId}/status`, { status }, {
      headers: getHeaders()
    });
    return response.data;
  },

  async updatePlan(planId, planData) {
    const response = await axios.put(`${API_BASE_URL}/admin/subscriptions/plans/${planId}`, planData, {
      headers: getHeaders()
    });
    return response.data;
  },

  async assignPlan(assignmentData) {
    const response = await axios.post(`${API_BASE_URL}/admin/subscriptions/assign`, assignmentData, {
      headers: getHeaders()
    });
    return response.data;
  },

  async getAllSubscriptions() {
    const response = await axios.get(`${API_BASE_URL}/admin/subscriptions`, {
      headers: getHeaders()
    });
    return response.data;
  },

  async getAllPayments() {
    const response = await axios.get(`${API_BASE_URL}/admin/subscriptions/payments`, {
      headers: getHeaders()
    });
    return response.data;
  },

  // Owner/Manager APIs
  async getMyPlan(locationId) {
    const response = await axios.get(`${API_BASE_URL}/admin/subscriptions/my-plan/${locationId}`, {
      headers: getHeaders()
    });
    return response.data;
  },

  async getMySubscriptions(locationId) {
    const response = await axios.get(`${API_BASE_URL}/admin/subscriptions/my-subscriptions/${locationId}`, {
      headers: getHeaders()
    });
    return response.data;
  }
};

export default SubscriptionService;
