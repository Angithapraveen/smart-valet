<template>
  <div class="login-page-wrapper">
    <!-- Background Layer with Gradient -->
    <div class="background-layer">
      <div class="gradient-overlay"></div>
      <div class="pattern-overlay"></div>
    </div>

    <!-- Login Card Container - Left Aligned -->
    <div class="login-container-wrapper">
      <Transition name="card-fade">
        <div class="parkplus-border">
          <div class="parkplus-card">
            <!-- Header Section -->
            <div class="login-header">
              <Transition name="fade-up" appear>
                <div class="icon-wrapper">
                  <svg class="parking-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 3C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 7H13C14.6569 7 16 8.34315 16 10C16 11.6569 14.6569 13 13 13H9V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M9 17V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </Transition>
              <Transition name="fade-up" appear :style="{ transitionDelay: '0.1s' }">
                <h1 class="login-title">Smart Valet Parking</h1>
              </Transition>
              <Transition name="fade-up" appear :style="{ transitionDelay: '0.2s' }">
                <p class="login-subtitle">Management System</p>
              </Transition>
            </div>

            <!-- Form Section -->
            <form @submit.prevent="handleLogin" class="login-form">
              <Transition name="fade-up" appear :style="{ transitionDelay: '0.3s' }">
                <div v-if="errorMessage" class="error-message">
                  <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  {{ errorMessage }}
                </div>
              </Transition>

              <Transition name="fade-up" appear :style="{ transitionDelay: '0.4s' }">
                <div class="form-group">
                  <label for="loginId" class="form-label">User ID, Email ID, or Phone Number</label>
                  <div class="input-wrapper">
                    <svg class="input-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <input
                      id="loginId"
                      type="text"
                      v-model="loginId"
                      required
                      placeholder="Enter user ID, email, or phone"
                      class="form-input"
                    />
                  </div>
                </div>
              </Transition>

              <Transition name="fade-up" appear :style="{ transitionDelay: '0.5s' }">
                <div class="form-group">
                  <label for="password" class="form-label">Password</label>
                  <div class="input-wrapper">
                    <svg class="input-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                    </svg>
                    <input
                      id="password"
                      type="password"
                      v-model="password"
                      required
                      placeholder="Enter your password"
                      class="form-input"
                    />
                  </div>
                </div>
              </Transition>

              <Transition name="fade-up" appear :style="{ transitionDelay: '0.6s' }">
                <button 
                  type="submit" 
                  class="login-button" 
                  :disabled="loading"
                  :class="{ 'loading': loading }"
                >
                  <span v-if="!loading">Login</span>
                  <span v-else class="button-loading">
                    <svg class="animate-spin" viewBox="0 0 20 20" fill="none">
                      <circle class="opacity-25" cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 10a6 6 0 0112 0"></path>
                    </svg>
                    Logging in...
                  </span>
                </button>
              </Transition>
            </form>

            <!-- Footer -->
            <Transition name="fade-up" appear :style="{ transitionDelay: '0.7s' }">
              <p class="login-footer">Secure access only</p>
            </Transition>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

export default {
  name: 'Login',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    
    const loginId = ref('');
    const password = ref('');
    const loading = ref(false);
    const errorMessage = ref('');

    const handleLogin = async () => {
      errorMessage.value = '';
      loading.value = true;

      try {
        const result = await authStore.login(loginId.value.trim(), password.value);

        if (result.success) {
          // Redirect based on role
          const role = result.role;
          if (role === 'ADMIN') {
            router.push('/admin/dashboard');
          } else if (role === 'OWNER') {
            router.push('/owner/dashboard');
          } else if (role === 'MANAGER') {
            router.push('/manager/dashboard');
          } else {
            errorMessage.value = 'Invalid role. Access denied.';
            loading.value = false;
          }
        } else {
          errorMessage.value = result.message || 'Login failed. Please try again.';
          loading.value = false;
        }
      } catch (error) {
        errorMessage.value = error.response?.data?.message || 'An error occurred. Please try again.';
        loading.value = false;
      }
    };

    return {
      loginId,
      password,
      loading,
      errorMessage,
      handleLogin
    };
  }
};
</script>

<style scoped>
/* Page Wrapper */
.login-page-wrapper {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
  padding-right: 80px;
}

@media (max-width: 768px) {
  .login-page-wrapper {
    justify-content: center;
    padding-left: 20px;
    padding-right: 20px;
  }
}

/* Background Layer */
.background-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: url('/images/Parking_login.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  animation: backgroundFadeIn 1s ease-out;
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  opacity: 0.85;
  mix-blend-mode: multiply;
}

.pattern-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  opacity: 0.6;
}

/* Login Container Wrapper */
.login-container-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 460px;
}

/* Outer Animated Border - Park+ Style */
.parkplus-border {
  position: relative;
  width: 100%;
  max-width: 480px;
  border-radius: 20px;
  padding: 2px;
  overflow: hidden;
}

/* Silver Running Light */
.parkplus-border::before {
  content: "";
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  background: conic-gradient(
    rgba(216, 207, 251, 0) 0deg,
    rgba(216, 207, 251, 0) 120deg,
    #ffffff 160deg,
    rgba(216, 207, 251, 0) 200deg,
    rgba(216, 207, 251, 0) 260deg,
    #d3c9fb 300deg,
    rgba(216, 207, 251, 0) 360deg
  );
  animation: parkplus-spin 5s linear infinite;
  z-index: 0;
  will-change: transform;
}

/* Inner Black Login Card */
.parkplus-card {
  position: relative;
  z-index: 1;
  background: #0e0e0e;
  color: #ffffff;
  border-radius: 18px;
  padding: 48px 40px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
}

/* Header */
.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  border-radius: 16px;
  margin-bottom: 20px;
  box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
}

.parking-icon {
  width: 32px;
  height: 32px;
  color: white;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.login-subtitle {
  font-size: 14px;
  color: #9ca3af;
  font-weight: 500;
}

/* Form */
.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
  letter-spacing: 0.3px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  width: 20px;
  height: 20px;
  color: #9ca3af;
  pointer-events: none;
  z-index: 1;
}

.form-input {
  width: 100%;
  padding: 14px 16px 14px 48px;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  font-size: 15px;
  color: #ffffff;
  background: #1a1a1a;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #6545e5;
  background: #1a1a1a;
  box-shadow: 0 0 0 4px rgba(101, 69, 229, 0.2);
}

.form-input::placeholder {
  color: #9ca3af;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  color: #DC2626;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 24px;
  font-size: 14px;
  font-weight: 500;
}

.error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Login Button */
.login-button {
  width: 100%;
  padding: 14px 24px;
  background: #6545e5;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px 0 rgba(101, 69, 229, 0.4);
  position: relative;
  overflow: hidden;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(101, 69, 229, 0.5);
  background: #7c5ef0;
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.button-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.button-loading svg {
  width: 18px;
  height: 18px;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Footer */
.login-footer {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
  margin-top: 24px;
}

/* Animations */
@keyframes backgroundFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes parkplus-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Vue Transitions */
.card-fade-enter-active {
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-up-enter-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .parkplus-border {
    border-radius: 20px;
    padding: 2px;
  }

  .parkplus-card {
    padding: 36px 28px;
    border-radius: 18px;
  }

  .login-title {
    font-size: 24px;
  }

  .icon-wrapper {
    width: 56px;
    height: 56px;
  }

  .parking-icon {
    width: 28px;
    height: 28px;
  }
}

@media (max-width: 640px) {
  .parkplus-card {
    padding: 32px 24px;
  }
}
</style>
