<template>
  <div class="location-details-page">
    <!-- Standalone Back Button -->
    <div class="top-navigation">
        <button class="back-link" @click="$router.push('/admin/dashboard')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Dashboard
        </button>
    </div>

    <!-- Loading State -->
    <div v-if="!location" class="loading-state">
        Loading location details...
    </div>

    <!-- Main Content Details (Now on Top) -->
    <div class="content-header-info" v-if="location">
        <!-- Identity Card -->
        <div class="identity-panel">
            <div class="identity-main">
                <div class="loc-icon-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div>
                    <h1>{{ location.location_name }}</h1>
                    <div class="location-codes">
                        <span class="location-type">{{ location.location_type }}</span>
                        <span class="location-code" title="Location Short Code">{{ location.location_short_code || '---' }}</span>
                        <span class="badge" :class="location.status ? 'badge-success' : 'badge-danger'">
                            {{ location.status ? 'Active' : 'Inactive' }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="info-row">
                <div class="info-item-flat">
                    <label>Location ID</label>
                    <p class="font-mono">{{ location.location_id }}</p>
                </div>
                <div class="info-item-flat">
                    <label>Address</label>
                    <p>{{ location.address || 'No address provided' }}</p>
                </div>
                <div class="info-item-flat">
                    <label>Valid From</label>
                    <p>{{ location.valid_from ? new Date(location.valid_from).toLocaleDateString() : 'N/A' }}</p>
                </div>
                <div class="info-item-flat">
                    <label>Valid To</label>
                    <p>{{ location.valid_to ? new Date(location.valid_to).toLocaleDateString() : 'N/A' }}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content Grid -->
    <div class="content-area-wide" v-if="location">

        <!-- Right Column: Tabs & Data -->
        <main class="main-data-area">
            <div class="tabs-container">
                <div class="tabs-header">
                    <button 
                        v-for="tab in tabs" 
                        :key="tab.id"
                        class="tab-btn"
                        :class="{ active: currentTab === tab.id }"
                        @click="currentTab = tab.id"
                    >
                        {{ tab.label }}
                    </button>
                </div>

                <div class="tab-content-area">
                    <!-- BLOCKS TAB -->
                    <div v-if="currentTab === 'blocks'" class="tab-pane">
                        <div class="pane-header">
                            <h3>Blocks Management</h3>
                            <button class="btn btn-primary btn-sm icon-btn" @click="showBlockModal = true">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                Add Block
                            </button>
                        </div>
                        
                        <div v-if="tabLoading" class="loading-state">
                            <p>Loading blocks...</p>
                        </div>
                        
                        <div v-else-if="blocks.length > 0" class="blocks-container">
                            <div v-for="block in blocks" :key="block.block_id" class="block-detail-card">
                                <div class="block-card-header">
                                    <div class="block-info-row">
                                        <div>
                                            <h4 class="block-name">{{ block.block_name }}</h4>
                                            <span class="block-id">{{ block.block_id }}</span>
                                        </div>
                                        <span class="status-badge" :class="block.status ? 'status-active' : 'status-inactive'">
                                            {{ block.status ? 'ACTIVE' : 'INACTIVE' }}
                                        </span>
                                    </div>
                                </div>

                                <div class="block-details-grid">
                                    <div class="detail-item">
                                        <span class="detail-label">Capacity</span>
                                        <span class="detail-value">{{ block.capacity }} Slots</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">Validity</span>
                                        <span class="detail-value">{{ formatDate(block.valid_from) }} → {{ formatDate(block.valid_to) }}</span>
                                    </div>
                                </div>

                                <button class="btn-edit-block" @click="openEditBlock(block)">
                                    Edit Block
                                </button>

                                <div class="entries-section">
                                    <h5 class="entries-heading">Parking Slots</h5>
                                    <div class="entries-grid">
                                        <div v-for="entry in block.entries" :key="entry.block_entry_id" 
                                             class="entry-box" :class="entry.status === 'AVAILABLE' ? 'entry-available' : 'entry-occupied'">
                                            <div class="entry-id">{{ entry.block_entry_id }}</div>
                                            <div class="entry-status">{{ entry.status }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="empty-state-pane">
                            <p>No blocks configured for this location yet.</p>
                        </div>
                    </div>

                    <!-- OWNERS TAB (Admin Only) -->
                    <div v-if="currentTab === 'owners'" class="tab-pane">
                        <div class="pane-header">
                            <h3>Assigned Owners</h3>
                            <button class="btn btn-primary btn-sm icon-btn" @click="openUserModal('OWNER')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                Add Owner
                            </button>
                        </div>
                        
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th class="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="owner in owners" :key="owner.user_id">
                                        <td class="font-medium">{{ owner.name }}</td>
                                        <td class="text-dim">{{ owner.email_id }}</td>
                                        <td class="text-dim">{{ owner.phone_number }}</td>
                                        <td>
                                            <div class="status-container">
                                                <span class="status-dot" :class="owner.status ? 'active' : 'inactive'"></span>
                                                {{ owner.status ? 'Active' : 'Inactive' }}
                                            </div>
                                        </td>
                                        <td class="text-right">
                                            <button 
                                                class="action-btn" 
                                                :class="owner.status ? 'btn-deactivate' : 'btn-activate'"
                                                @click="toggleUserStatus(owner)"
                                                :disabled="togglingUser === owner.user_id"
                                            >
                                                {{ togglingUser === owner.user_id ? 'Wait...' : (owner.status ? 'Deactivate' : 'Activate') }}
                                            </button>
                                        </td>
                                    </tr>
                                    <tr v-if="owners.length === 0">
                                        <td colspan="5" class="empty-message">No owners assigned to this location.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                     <div v-if="currentTab === 'managers'" class="tab-pane">
                        <div class="pane-header">
                            <h3>Assigned Managers</h3>
                            <button class="btn btn-primary btn-sm icon-btn" @click="openUserModal('MANAGER')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                Add Manager
                            </button>
                        </div>
                        
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th class="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="manager in managers" :key="manager.user_id">
                                        <td class="font-medium">{{ manager.name }}</td>
                                        <td class="text-dim">{{ manager.email_id }}</td>
                                        <td class="text-dim">{{ manager.phone_number }}</td>
                                        <td>
                                            <div class="status-container">
                                                <span class="status-dot" :class="manager.status ? 'active' : 'inactive'"></span>
                                                {{ manager.status ? 'Active' : 'Inactive' }}
                                            </div>
                                        </td>
                                        <td class="text-right">
                                            <div class="action-group">
                                                <button class="btn-icon" @click="openUserModal('MANAGER', manager)" title="Edit">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </button>
                                                <button 
                                                    class="action-btn" 
                                                    :class="manager.status ? 'btn-deactivate' : 'btn-activate'"
                                                    @click="toggleUserStatus(manager)"
                                                    :disabled="togglingUser === manager.user_id"
                                                >
                                                    {{ togglingUser === manager.user_id ? 'Wait...' : (manager.status ? 'Deactivate' : 'Activate') }}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr v-if="managers.length === 0">
                                        <td colspan="4" class="empty-message">No managers assigned to this location.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- DRIVERS TAB -->
                    <div v-if="currentTab === 'drivers'" class="tab-pane">
                         <div class="pane-header">
                            <h3>Assigned Drivers</h3>
                            <!-- <button class="btn btn-primary btn-sm">Add Driver</button> -->
                        </div>
                        
                        <div class="table-container" v-if="isOwner">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th class="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="driver in drivers" :key="driver.user_id">
                                        <td class="font-medium">{{ driver.name }}</td>
                                        <td class="text-dim">{{ driver.email_id }}</td>
                                        <td class="text-dim">{{ driver.phone_number }}</td>
                                        <td>
                                            <div class="status-container">
                                                <span class="status-dot" :class="driver.status ? 'active' : 'inactive'"></span>
                                                {{ driver.status ? 'Active' : 'Inactive' }}
                                            </div>
                                        </td>
                                        <td class="text-right">
                                            <button 
                                                class="action-btn" 
                                                :class="driver.status ? 'btn-deactivate' : 'btn-activate'"
                                                @click="toggleUserStatus(driver)"
                                                :disabled="togglingUser === driver.user_id"
                                            >
                                                {{ togglingUser === driver.user_id ? 'Wait...' : (driver.status ? 'Deactivate' : 'Activate') }}
                                            </button>
                                        </td>
                                    </tr>
                                    <tr v-if="drivers.length === 0">
                                        <td colspan="4" class="empty-message">No drivers assigned to this location.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-else class="table-container">
                             <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th class="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="driver in drivers" :key="driver.user_id">
                                        <td class="font-medium">{{ driver.name }}</td>
                                        <td class="text-dim">{{ driver.email_id }}</td>
                                        <td class="text-dim">{{ driver.phone_number }}</td>
                                        <td>
                                            <div class="status-container">
                                                <span class="status-dot" :class="driver.status ? 'active' : 'inactive'"></span>
                                                {{ driver.status ? 'Active' : 'Inactive' }}
                                            </div>
                                        </td>
                                        <td class="text-right">
                                            <button 
                                                class="action-btn" 
                                                :class="driver.status ? 'btn-deactivate' : 'btn-activate'"
                                                @click="toggleUserStatus(driver)"
                                                :disabled="togglingUser === driver.user_id"
                                            >
                                                {{ togglingUser === driver.user_id ? 'Wait...' : (driver.status ? 'Deactivate' : 'Activate') }}
                                            </button>
                                        </td>
                                    </tr>
                                    <tr v-if="drivers.length === 0">
                                        <td colspan="5" class="empty-message">No drivers found.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- SUBSCRIPTIONS TAB -->
                    <div v-if="currentTab === 'subscriptions'" class="tab-pane">
                        <div class="pane-header">
                            <h3>Subscription Status</h3>
                            <div class="header-badges" v-if="currentSubscription">
                                <span class="badge" :class="getPlanBadgeClass(currentSubscription)">
                                    {{ currentSubscription.status }}
                                </span>
                            </div>
                        </div>

                        <div v-if="tabLoading" class="loading-state">
                            <p>Loading subscription details...</p>
                        </div>

                        <div v-else-if="currentSubscription" class="subscription-overview">
                            <!-- Active Plan Card -->
                            <div class="active-plan-card">
                                <div class="plan-main-info">
                                    <div class="plan-identity">
                                        <div class="plan-icon-hex">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
                                        </div>
                                        <div>
                                            <h4 class="plan-display-name">{{ currentSubscription.plan_name }}</h4>
                                            <p class="plan-validity">Valid until {{ formatDate(currentSubscription.end_date) }}</p>
                                        </div>
                                    </div>
                                    <div class="plan-pricing">
                                        <span class="price-tag">Active</span>
                                    </div>
                                </div>

                                <div class="usage-grid">
                                    <div class="usage-stat">
                                        <label>Remaining</label>
                                        <div class="stat-value highlight">{{ currentSubscription.remaining_transactions }}</div>
                                        <div class="stat-sub">Transactions</div>
                                    </div>
                                    <div class="usage-stat">
                                        <label>Plan Limit</label>
                                        <div class="stat-value">{{ currentSubscription.plan_limit }}</div>
                                        <div class="stat-sub">Total Credits</div>
                                    </div>
                                    <div class="usage-stat">
                                        <label>Duration</label>
                                        <div class="stat-value">{{ currentSubscription.duration_months }}</div>
                                        <div class="stat-sub">Months</div>
                                    </div>
                                </div>

                                <div class="usage-progress-container">
                                    <div class="progress-labels">
                                        <span>Usage Progress</span>
                                        <span>{{ calculateUsagePercent(currentSubscription) }}% Used</span>
                                    </div>
                                    <div class="progress-bar-bg">
                                        <div class="progress-bar-fill" :style="{ width: calculateUsagePercent(currentSubscription) + '%' }" :class="getUsageColorClass(currentSubscription)"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- History Table -->
                            <div class="subscription-history-section">
                                <h4 class="sub-section-title">Subscription History</h4>
                                <div class="table-container compact-table">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Plan Name</th>
                                                <th>Purchased On</th>
                                                <th>Expiry Date</th>
                                                <th>Initial Credits</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="sub in subscriptionHistory" :key="sub.subscription_id">
                                                <td class="font-medium">{{ sub.plan_name }}</td>
                                                <td class="text-dim">{{ formatDate(sub.start_date) }}</td>
                                                <td class="text-dim">{{ formatDate(sub.end_date) }}</td>
                                                <td>{{ sub.remaining_transactions }}</td>
                                                <td>
                                                    <span class="status-pill" :class="sub.status.toLowerCase()">
                                                        {{ sub.status }}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr v-if="subscriptionHistory.length === 0">
                                                <td colspan="5" class="empty-message">No subscription history found.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div v-else class="empty-state-pane">
                            <div class="no-sub-content">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-dim"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                <p>This location does not have an active subscription.</p>
                                <button class="btn btn-primary mt-4" @click="$router.push('/admin/dashboard')">Assign a Plan</button>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>

        <!-- User Management Modal (Add/Edit Manager/Driver/Owner) -->
        <div v-if="showUserModal" class="modal-overlay" @click.self="closeUserModal">
            <div class="modal-container professional-modal">
                <div class="modal-header">
                    <div class="header-icon-title">
                        <div class="icon-circle">
                            <svg v-if="userModalRole === 'OWNER'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            <svg v-else-if="userModalRole === 'MANAGER'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                        </div>
                        <h2>{{ editingUser ? 'Edit' : 'Add New' }} <span class="text-primary">{{ userModalRole === 'OWNER' ? 'Owner' : (userModalRole === 'MANAGER' ? 'Manager' : 'Driver') }}</span></h2>
                    </div>
                    <button class="close-btn" @click="closeUserModal">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <form @submit.prevent="saveUser" class="modal-form">
                    <div v-if="userModalError" class="modal-error-message">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        {{ userModalError }}
                    </div>
                    <div class="modal-body-grid">
                        <div class="form-group full-width">
                            <label>Full Name <span class="required">*</span></label>
                            <div class="input-wrapper">
                                <input v-model="userForm.name" type="text" placeholder="e.g. John Doe" required class="form-input-styled" @input="handleNameInput">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Email Address *</label>
                            <div class="input-wrapper">
                                <input 
                                    v-model="userForm.email_id" 
                                    type="email" 
                                    placeholder="e.g. john@example.com" 
                                    autocomplete="off"
                                    @input="handleEmailInput"
                                    required 
                                    class="form-input-styled"
                                >
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Phone Number *</label>
                            <div class="input-wrapper">
                                <input 
                                    v-model="userForm.phone_number" 
                                    type="text" 
                                    placeholder="Enter 10-digit phone number" 
                                    maxlength="10"
                                    @input="handlePhoneInput"
                                    autocomplete="off"
                                    required 
                                    class="form-input-styled"
                                >
                            </div>
                        </div>
                        <div class="form-group full-width" v-if="!editingUser">
                            <label>Password *</label>
                            <div class="input-wrapper">
                                <input 
                                    v-model="userForm.password" 
                                    type="password" 
                                    placeholder="Enter password" 
                                    autocomplete="new-password"
                                    required 
                                    class="form-input-styled" 
                                    minlength="6"
                                >
                            </div>
                            <span class="field-hint">Minimum 6 characters</span>
                        </div>
                    </div>
                    
                    <div class="modal-actions-styled">
                        <button type="button" class="btn btn-secondary" @click="closeUserModal">Cancel</button>
                        <button type="submit" class="btn btn-primary" :disabled="savingUser">
                            {{ savingUser ? 'Saving...' : (editingUser ? 'Save Changes' : 'Create User') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    <!-- Add Block Modal -->
    <div v-if="showBlockModal" class="modal-overlay" @click.self="closeBlockModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add New Block</h2>
                <button class="modal-close" @click="closeBlockModal">×</button>
            </div>
            <form @submit.prevent="submitBlock">
                <div v-if="blockError" class="error-message">{{ blockError }}</div>
                
                <div class="form-group">
                    <label>Block Name <span class="required">*</span></label>
                    <input v-model="blockForm.block_name" type="text" required placeholder="e.g. Basement A" class="form-input" />
                </div>
                
                <div class="form-group">
                    <label>Capacity <span class="required">*</span></label>
                    <input v-model.number="blockForm.capacity" type="number" required min="1" max="1000" placeholder="e.g. 50" class="form-input" />
                    <span class="hint">Number of parking slots (1-1000)</span>
                </div>
                
                <div class="form-group">
                    <label>Valid From <span class="required">*</span></label>
                    <input v-model="blockForm.valid_from" type="date" required class="form-input" />
                </div>
                
                <div class="form-group">
                    <label>Valid To <span class="required">*</span></label>
                    <input v-model="blockForm.valid_to" type="date" required class="form-input" />
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" @click="closeBlockModal">Cancel</button>
                    <button type="submit" class="btn-primary" :disabled="blockLoading">
                        {{ blockLoading ? 'Creating...' : 'Create Block' }}
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Block Modal -->
    <div v-if="showEditBlockModal" class="modal-overlay" @click.self="closeEditBlockModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Block</h2>
                <button class="modal-close" @click="closeEditBlockModal">×</button>
            </div>
            <form @submit.prevent="submitEditBlock">
                <div v-if="editBlockError" class="error-message">{{ editBlockError }}</div>
                
                <div class="form-group">
                    <label>Block ID</label>
                    <input :value="editBlockForm.block_id" type="text" disabled class="form-input" style="background: #f3f4f6; cursor: not-allowed;" />
                </div>
                
                <div class="form-group">
                    <label>Block Name <span class="required">*</span></label>
                    <input v-model="editBlockForm.block_name" type="text" required class="form-input" />
                </div>
                
                <div class="form-group">
                    <label>Capacity <span class="required">*</span></label>
                    <input v-model.number="editBlockForm.capacity" type="number" required min="1" max="1000" class="form-input" />
                    <span class="hint">Increasing capacity adds new slots. Decreasing capacity only removes AVAILABLE slots.</span>
                </div>
                
                <div class="form-group">
                    <label>Valid From <span class="required">*</span></label>
                    <input v-model="editBlockForm.valid_from" type="date" required class="form-input" />
                </div>
                
                <div class="form-group">
                    <label>Valid To <span class="required">*</span></label>
                    <input v-model="editBlockForm.valid_to" type="date" required class="form-input" />
                </div>
                
                <div class="form-group">
                    <label>Status <span class="required">*</span></label>
                    <select v-model="editBlockForm.status" required class="form-input">
                        <option :value="true">Active</option>
                        <option :value="false">Inactive</option>
                    </select>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" @click="closeEditBlockModal">Cancel</button>
                    <button type="submit" class="btn-primary" :disabled="editBlockLoading">
                        {{ editBlockLoading ? 'Updating...' : 'Update Block' }}
                    </button>
                </div>
            </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const locationId = route.params.id;

const location = ref(null);
const owners = ref([]);
const managers = ref([]);
const drivers = ref([]);
const blocks = ref([]);
const currentTab = ref('');
const tabLoading = ref(false);
const togglingUser = ref(null);
const currentSubscription = ref(null);
const subscriptionHistory = ref([]);

// Modal states
const showBlockModal = ref(false);
const showEditBlockModal = ref(false);
const blockLoading = ref(false);
const editBlockLoading = ref(false);
const blockError = ref('');
const editBlockError = ref('');

// User Management States
const showUserModal = ref(false);
const userModalRole = ref('');
const editingUser = ref(null);
const savingUser = ref(false);
const userModalError = ref('');
const userForm = ref({
    name: '',
    email_id: '',
    phone_number: '',
    password: ''
});

// Forms
const blockForm = ref({
    block_name: '',
    capacity: null,
    valid_from: '',
    valid_to: ''
});

const editBlockForm = ref({
    block_id: '',
    block_name: '',
    capacity: null,
    valid_from: '',
    valid_to: '',
    status: true
});

const isOwner = computed(() => authStore.userRole === 'OWNER');
const isAdmin = computed(() => authStore.userRole === 'ADMIN');

const tabs = computed(() => {
    if (isOwner.value) {
        return [
            { id: 'blocks', label: 'Blocks' },
            { id: 'managers', label: 'Managers' },
            { id: 'drivers', label: 'Drivers' },
            { id: 'subscriptions', label: 'Subscriptions' }
        ];
    }
    return [
        { id: 'blocks', label: 'Blocks' },
        { id: 'owners', label: 'Owners' },
        { id: 'managers', label: 'Managers' },
        { id: 'drivers', label: 'Drivers' },
        { id: 'subscriptions', label: 'Subscriptions' }
    ];
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const openUserModal = (role, user = null) => {
    userModalRole.value = role;
    editingUser.value = user;
    if (user) {
        userForm.value = {
            name: user.name,
            email_id: user.email_id,
            phone_number: user.phone_number,
            password: '' // Not used for editing
        };
    } else {
        userForm.value = {
            name: '',
            email_id: '',
            phone_number: '',
            password: ''
        };
    }
    userModalError.value = '';
    showUserModal.value = true;
};

const handleNameInput = () => {
    userForm.value.name = userForm.value.name.replace(/[^a-zA-Z\s]/g, '');
};

const handleEmailInput = (e) => {
    // Only allow characters valid in an email address while typing
    const value = e.target.value.replace(/[^a-zA-Z0-9@._%+-]/g, '');
    userForm.value.email_id = value.toLowerCase();
};

const handlePhoneInput = (e) => {
    // Allow only digits
    const value = e.target.value.replace(/\D/g, '');
    // Limit to 10 digits
    userForm.value.phone_number = value.slice(0, 10);
};

const closeUserModal = () => {
    showUserModal.value = false;
    editingUser.value = null;
    userModalError.value = '';
    userForm.value = {
        name: '',
        email_id: '',
        phone_number: '',
        password: ''
    };
};

const saveUser = async () => {
    userModalError.value = '';
    // 1. Check if all required fields are filled
    if (!userForm.value.name || !userForm.value.email_id || !userForm.value.phone_number) {
        userModalError.value = 'Please fill in all required fields.';
        return;
    }

    // 2. Email Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(userForm.value.email_id)) {
        userModalError.value = 'Enter a valid email address';
        return;
    }

    // 3. Phone Validation
    if (userForm.value.phone_number.length !== 10) {
        userModalError.value = 'Phone number must be exactly 10 digits.';
        return;
    }

    // 4. Password validation (only for new users)
    if (!editingUser.value && (!userForm.value.password || userForm.value.password.length < 6)) {
        userModalError.value = 'Password must be at least 6 characters.';
        return;
    }

    savingUser.value = true;
    try {
        const isEdit = !!editingUser.value;
        const endpoint = isEdit
            ? `${API_URL}/admin/users/${editingUser.value.user_id}`
            : `${API_URL}/admin/locations/${locationId}/manager`; // Currently only managers

        // Use PUT for edit, POST for new
        const method = isEdit ? 'put' : 'post';
        
        const payload = { ...userForm.value };
        if (isEdit) delete payload.password;
        
        // Handle OWNER creation specifically
        if (!isEdit && userModalRole.value === 'OWNER') {
             const ownerPayload = {
                name: userForm.value.name,
                email_id: userForm.value.email_id,
                phone_number: userForm.value.phone_number,
                password: userForm.value.password,
                location_id: locationId
            };
            const response = await axios.post(`${API_URL}/admin/owners`, ownerPayload, {
                headers: { Authorization: `Bearer ${authStore.token}` }
            });

             if (response.data.success) {
                // Refresh owners list
                fetchOwners();
                closeUserModal();
                toast.success('Owner created and assigned successfully');
            }
            return; // Exit as owner flow is distinct
        }

        const response = await axios[method](endpoint, payload, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });

        if (response.data.success) {
            if (isEdit) {
                // Update local list
                const index = managers.value.findIndex(m => m.user_id === editingUser.value.user_id);
                if (index !== -1) {
                    managers.value[index] = { ...managers.value[index], ...response.data.data };
                }
            } else {
                // Refresh list or push
                managers.value.unshift(response.data.data);
            }
            closeUserModal();
        }
    } catch (e) {
        alert(e.response?.data?.message || 'Failed to save user.');
    } finally {
        savingUser.value = false;
    }
};

const fetchLocationDetails = async () => {
    try {
        let endpoint = `${API_URL}/admin/locations`;
        if (isOwner.value) {
            endpoint = `${API_URL}/dashboard/owner/locations`;
        }

        const response = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            const loc = response.data.data.find(l => l.location_id === locationId);
            if (loc) location.value = loc;
        }
    } catch (e) {
        console.error("Error fetching location", e);
    }

    // Initial data fetch based on default tab (blocks)
    // If Admin, default fetch is important, checks based on tab
    if (isAdmin.value && currentTab.value === '') {
        currentTab.value = 'blocks';
    } else if (isOwner.value && currentTab.value === '') {
        currentTab.value = 'blocks';
    }

    fetchBlocks();
    
    // Fetch all relevant users for the location
    if (isAdmin.value) {
        fetchOwners();
        fetchManagers();
        fetchDrivers();
        fetchSubscriptions();
    } else if (isOwner.value) {
        fetchManagers();
        fetchDrivers();
        fetchSubscriptions();
    }
};

const fetchSubscriptions = async () => {
    try {
        // Fetch current active plan
        const currentRes = await axios.get(`${API_URL}/admin/subscriptions/my-plan/${locationId}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (currentRes.data.success) {
            currentSubscription.value = currentRes.data.data;
        }

        // Fetch history
        const historyRes = await axios.get(`${API_URL}/admin/subscriptions/my-subscriptions/${locationId}`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (historyRes.data.success) {
            subscriptionHistory.value = historyRes.data.data;
        }
    } catch (e) {
        console.error("Error fetching subscriptions", e);
    }
};

const calculateUsagePercent = (sub) => {
    if (!sub || !sub.plan_limit) return 0;
    const used = sub.used_transactions || 0;
    return Math.min(Math.round((used / sub.plan_limit) * 100), 100);
};

const getUsageColorClass = (sub) => {
    const percent = calculateUsagePercent(sub);
    if (percent > 90) return 'critical';
    if (percent > 70) return 'warning';
    return 'safe';
};

const getPlanBadgeClass = (sub) => {
    if (!sub) return '';
    const isExpired = sub.status === 'EXPIRED' || (sub.end_date && new Date(sub.end_date) < new Date());
    if (isExpired) return 'badge-danger';
    if (sub.remaining_transactions <= 0) return 'badge-warning';
    return 'badge-success';
};

const fetchOwners = async () => {
    if (!isAdmin.value) return; 
    try {
        const response = await axios.get(`${API_URL}/admin/locations/${locationId}/owners`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            owners.value = response.data.data;
        }
    } catch (e) {
        console.error("Error fetching owners", e);
    }
};

const fetchBlocks = async () => {
    tabLoading.value = true;
    try {
        const endpoint = isAdmin.value 
            ? `${API_URL}/admin/blocks/locations/${locationId}/blocks`
            : `${API_URL}/owner/locations/${locationId}/blocks`;
            
        const response = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            blocks.value = response.data.data;
        }
    } catch (e) {
        console.error("Error fetching blocks", e);
    } finally {
        tabLoading.value = false;
    }
};

const fetchManagers = async () => {
    tabLoading.value = true;
    try {
        const endpoint = isAdmin.value 
            ? `${API_URL}/dashboard/admin/locations/${locationId}/users`
            : `${API_URL}/dashboard/owner/locations/${locationId}/users`;
            
        const response = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            managers.value = response.data.data.managers || [];
        }
    } catch (e) {
        console.error("Error fetching managers", e);
    } finally {
        tabLoading.value = false;
    }
};

const fetchDrivers = async () => {
    tabLoading.value = true;
    try {
        const endpoint = isAdmin.value 
            ? `${API_URL}/dashboard/admin/locations/${locationId}/users`
            : `${API_URL}/dashboard/owner/locations/${locationId}/users`;
            
        const response = await axios.get(endpoint, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            drivers.value = response.data.data.drivers || [];
        }
    } catch (e) {
        console.error("Error fetching drivers", e);
    } finally {
        tabLoading.value = false;
    }
};

const toggleUserStatus = async (user) => {
    togglingUser.value = user.user_id;
    try {
        const endpoint = isAdmin.value 
            ? `${API_URL}/admin/users/${user.user_id}/status`
            : `${API_URL}/owner/user/${user.user_id}/status`;

        const response = await axios.put(endpoint, 
            { status: !user.status },
            { headers: { Authorization: `Bearer ${authStore.token}` } }
        );

        if (response.data.success) {
            user.status = !user.status;
        }
    } catch (e) {
        alert(e.response?.data?.message || 'Failed to update user status');
    } finally {
        togglingUser.value = null;
    }
};

const fetchOwnerData = async () => {
    if (!isOwner.value) return;

    // Fetch Users (Managers & Drivers)
    try {
        const usersResponse = await axios.get(`${API_URL}/dashboard/owner/locations/${locationId}/users`, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (usersResponse.data.success) {
            managers.value = usersResponse.data.data.managers || [];
            drivers.value = usersResponse.data.data.drivers || [];
        }
    } catch (e) {
        console.error("Error fetching owner users", e);
    }

    // Fetch Blocks
    fetchBlocks();
};

const openEditBlock = (block) => {
    editBlockForm.value = {
        block_id: block.block_id,
        block_name: block.block_name,
        capacity: block.capacity,
        valid_from: block.valid_from ? block.valid_from.split('T')[0] : '',
        valid_to: block.valid_to ? block.valid_to.split('T')[0] : '',
        status: block.status
    };
    showEditBlockModal.value = true;
};

const closeBlockModal = () => {
    showBlockModal.value = false;
    blockError.value = '';
    blockForm.value = { block_name: '', capacity: null, valid_from: '', valid_to: '' };
};

const closeEditBlockModal = () => {
    showEditBlockModal.value = false;
    editBlockError.value = '';
};

const submitBlock = async () => {
    blockError.value = '';
    
    if (blockForm.value.capacity <= 0 || blockForm.value.capacity > 1000) {
        blockError.value = 'Capacity must be between 1 and 1000.';
        return;
    }
    
    blockLoading.value = true;
    try {
        const payload = {
            ...blockForm.value,
            location_id: locationId
        };
        const endpoint = isAdmin.value ? `${API_URL}/admin/blocks` : `${API_URL}/owner/locations/${locationId}/blocks`;
        const response = await axios.post(endpoint, payload, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            closeBlockModal();
            fetchBlocks();
            alert('Block created successfully!');
        }
    } catch (e) {
        blockError.value = e.response?.data?.message || 'Failed to create block';
    } finally {
        blockLoading.value = false;
    }
};

const submitEditBlock = async () => {
    editBlockError.value = '';
    editBlockLoading.value = true;
    try {
        const endpoint = isAdmin.value 
            ? `${API_URL}/admin/blocks/${editBlockForm.value.block_id}`
            : `${API_URL}/owner/blocks/${editBlockForm.value.block_id}`;
            
        const response = await axios.put(endpoint, editBlockForm.value, {
            headers: { Authorization: `Bearer ${authStore.token}` }
        });
        if (response.data.success) {
            closeEditBlockModal();
            fetchBlocks();
            alert('Block updated successfully!');
        }
    } catch (e) {
        editBlockError.value = e.response?.data?.message || 'Failed to update block';
    } finally {
        editBlockLoading.value = false;
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

onMounted(async () => {
    await fetchLocationDetails();
    if (isAdmin.value) {
        fetchOwners();
        fetchBlocks(); // Admin also fetches blocks on mount
        fetchDrivers(); // Admin also fetches drivers
        currentTab.value = 'blocks'; // Default to blocks tab for easy testing
    } else if (isOwner.value) {
        fetchOwnerData();
        currentTab.value = 'blocks';
    }
});
</script>

<style scoped>
.top-navigation {
    margin-bottom: 24px;
}

.back-link {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    padding: 8px 12px 8px 0;
    transition: color 0.2s;
}

.back-link:hover {
    color: var(--primary);
}

/* Layout Grid (Now Wide) */
.content-area-wide {
    width: 100%;
}

/* Header Panel Styling */
.content-header-info {
    margin-bottom: 30px;
}

.identity-panel {
    background: var(--bg-card);
    padding: 30px;
    border-radius: 20px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-subtle);
}

.identity-main {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border-subtle);
}

.identity-main h1 {
    font-size: 28px;
    font-weight: 800;
    color: var(--text-main);
    margin: 0 0 8px 0;
    line-height: 1.2;
}

.info-row {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr 1fr;
    gap: 30px;
}

.info-item-flat {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.font-mono {
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 14px;
}

.info-item-flat label {
    font-size: 11px;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 1px;
    font-weight: 700;
}

.info-item-flat p {
    color: var(--text-main);
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    margin: 0;
}

.loc-icon-lg {
    width: 64px;
    height: 64px;
    background: var(--bg-main);
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
}

.location-codes {
    display: flex;
    gap: 12px;
    align-items: center;
}

.location-type {
    background: var(--primary-light);
    color: var(--primary);
    padding: 6px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.location-code {
    background: var(--bg-main);
    color: var(--text-muted);
    padding: 5px 12px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    border: 1px solid var(--border-subtle);
}

/* Standardized Sidebar/Card Removal (using new layout) */
.details-sidebar, .info-card, .identity-card, .content-grid {
    display: none;
}

.info-card h3 {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eee;
}

.info-item { margin-bottom: 20px; }
.info-item:last-child { margin-bottom: 0; }
.info-item label {
    display: block;
    font-size: 12px;
    text-transform: uppercase;
    color: #888;
    margin-bottom: 6px;
    letter-spacing: 0.5px;
    font-weight: 600;
}
.info-item p {
    color: #333;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.5;
}

/* Main Tabs Area */
.tabs-container {
    background: var(--bg-card);
    border-radius: 12px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-subtle);
    overflow: hidden;
    min-height: 500px;
}

.tabs-header {
    display: flex;
    border-bottom: 1px solid var(--border-subtle);
    padding: 0 24px;
    background: var(--bg-card);
}

.tab-btn {
    padding: 16px 24px;
    border: none;
    background: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: var(--ts-base);
}

.tab-btn:hover { color: #333; }
.tab-btn.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
    background: var(--bg-card);
}

.tab-content-area { padding: 0; }

.tab-pane { padding: 24px; }

.pane-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.pane-header h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-main);
}

/* Tables */
.table-container {
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    overflow: hidden;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th, .data-table td {
    padding: 14px 20px;
    text-align: left;
    border-bottom: 1px solid var(--border-subtle);
}

.status-container {
    display: flex;
    align-items: center;
    gap: 8px;
}

.action-btn {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
}

.btn-activate {
    background: var(--success-light);
    color: var(--success);
    border-color: var(--success-border, var(--success));
}

.btn-activate:hover {
    background: #dcfce7;
}

.btn-deactivate {
    background: var(--danger-light);
    color: var(--danger);
    border-color: var(--danger);
}

.btn-deactivate:hover {
    background: #fee2e2;
}

.action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.data-table th {
    background: var(--bg-main);
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover { background: #fcfcfc; }

.font-medium { font-weight: 600; color: var(--text-main); }
.text-dim { color: var(--text-muted); font-size: 14px; }
.text-right { text-align: right; }

.status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
}
.status-dot.active { background: #22c55e; }
.status-dot.inactive { background: #ef4444; }

.btn-text {
    background: none;
    border: none;
    color: var(--primary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
}
.btn-text:hover { text-decoration: underline; }

/* Buttons & Badges */
.btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.btn-primary {
    background: var(--primary);
    color: white;
}
.btn-primary:hover { background: var(--primary-hover); }

.btn-outline-primary {
    background: white;
    border-color: var(--primary);
    color: var(--primary);
}

.badge {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
}
.badge-success { background: #dcfce7; color: #15803d; }
.badge-danger { background: #fee2e2; color: #b91c1c; }

.text-success { color: #15803d; font-weight: 600; }
.text-danger { color: #b91c1c; font-weight: 600; }

.loading-state, .empty-state-pane, .empty-message {
    text-align: center;
    padding: 40px;
    color: var(--text-muted);
    background: var(--bg-main);
    border-radius: 8px;
}

@media (max-width: 1024px) {
    .content-grid {
        grid-template-columns: 1fr;
    }
}

/* Block Management Styles */
.blocks-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.block-detail-card {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: 12px;
    padding: 24px;
    box-shadow: var(--shadow-sm);
    transition: var(--ts-base);
}

.block-detail-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.block-card-header {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid var(--border-subtle);
}

.block-info-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.block-name {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-main);
    margin: 0 0 6px 0;
}

.block-id {
    display: inline-block;
    background: var(--bg-main);
    color: var(--text-muted);
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
}

.status-badge {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
}

.status-active {
    background: #dcfce7;
    color: #166534;
}

.status-inactive {
    background: #fee2e2;
    color: #991b1b;
}

.block-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.detail-label {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
}

.detail-value {
    font-size: 15px;
    color: var(--text-main);
    font-weight: 600;
}

.btn-edit-block {
    background: #6545e5;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 20px;
}

.btn-edit-block:hover {
    background: #7c5ef0;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(101, 69, 229, 0.2);
}

.entries-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 2px solid var(--border-subtle);
}

.entries-heading {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-main);
    margin: 0 0 16px 0;
}

.entries-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
}

.entry-box {
    padding: 12px 8px;
    border-radius: 8px;
    text-align: center;
    transition: all 0.2s;
    cursor: default;
    border: 2px solid;
}

.entry-box:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.entry-id {
    font-size: 11px;
    font-weight: 700;
    font-family: 'Courier New', monospace;
    margin-bottom: 4px;
}

.entry-status {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.entry-available {
    background: var(--success-light);
    color: var(--success);
    border-color: var(--success-border, var(--success-light));
}

.entry-occupied {
    background: var(--danger-light);
    color: var(--danger);
    border-color: var(--danger);
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: var(--bg-card);
    border-radius: 12px;
    width: 100%;
    max-width: 500px;
    padding: 30px;
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--border-subtle);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.modal-header h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-main);
    margin: 0;
}

.modal-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #9ca3af;
    cursor: pointer;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 6px;
}

.form-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    font-size: 15px;
    background: var(--bg-main);
    color: var(--text-main);
}

/* User Management Modal Additions */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.modal-container {
    background: var(--bg-card);
    border-radius: 16px;
    width: 90%;
    max-width: 450px;
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--border-subtle);
}

.modal-form {
    padding: 24px;
}

.action-group {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
}

.btn-icon {
    background: #f1f5f9;
    color: #475569;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-icon:hover {
    background: #e2e8f0;
    color: var(--primary);
}

.close-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: var(--ts-base);
}

.close-btn:hover {
    background: #f1f5f9;
    color: #64748b;
}

.form-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(101, 69, 229, 0.1);
}

.hint {
    display: block;
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 4px;
}

.error-message {
    background: #fee2e2;
    color: #b91c1c;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 30px;
}

.btn-secondary {
    padding: 10px 20px;
    background: var(--bg-main);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    color: var(--text-main);
    font-weight: 600;
    cursor: pointer;
}

/* Professional Modal Styles */
.professional-modal {
    max-width: 600px;
    width: 95%;
    background: var(--bg-card);
    border-radius: 24px;
    padding: 32px;
    box-shadow: var(--shadow-xl);
    border: 1px solid var(--border-subtle);
}

.header-icon-title {
    display: flex;
    align-items: center;
    gap: 16px;
}

.icon-circle {
    width: 48px;
    height: 48px;
    background: #f0fdf4;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
}

.header-icon-title h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--text-main);
    margin: 0;
}

.text-primary {
    color: var(--primary);
}

.modal-body-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 32px;
}

.full-width {
    grid-column: span 2;
}

.input-wrapper {
    position: relative;
    margin-top: 6px;
}

.form-input-styled {
    width: 100%;
    padding: 12px 16px;
    border: 1.5px solid var(--border-subtle);
    border-radius: 10px;
    font-size: 14px;
    transition: var(--ts-base);
    background: var(--bg-main);
    color: var(--text-main);
}

.form-input-styled:focus {
    outline: none;
    border-color: var(--primary);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(101, 69, 229, 0.1);
}

.modal-actions-styled {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 20px;
    border-top: 1px solid #f1f5f9;
}
.modal-error-message {
    background: #fef2f2;
    color: #ef4444;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 24px;
    border: 1px solid #fee2e2;
    display: flex;
    align-items: center;
    gap: 10px;
}
.subscription-overview {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.active-plan-card {
    background: linear-gradient(145deg, var(--bg-card) 0%, var(--bg-main) 100%);
    border: 1.5px solid var(--border-subtle);
    border-radius: 20px;
    padding: 32px;
    box-shadow: var(--shadow-md);
}

.plan-main-info {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
}

.plan-identity {
    display: flex;
    align-items: center;
    gap: 20px;
}

.plan-icon-hex {
    width: 64px;
    height: 64px;
    background: var(--primary);
    color: white;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12px 24px -8px var(--primary-shadow);
}

.plan-display-name {
    font-size: 24px;
    font-weight: 800;
    margin: 0 0 4px 0;
    color: var(--text-main);
    letter-spacing: -0.02em;
}

.plan-validity {
    font-size: 14px;
    color: var(--text-muted);
    font-weight: 500;
}

.price-tag {
    background: #ecfdf5;
    color: #059669;
    padding: 6px 16px;
    border-radius: 100px;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid #10b98133;
}

.usage-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 32px;
    padding: 24px;
    background: var(--bg-card);
    border-radius: 16px;
    border: 1px solid var(--border-subtle);
}

.usage-stat {
    text-align: center;
}

.usage-stat label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 0.1em;
}

.stat-value {
    font-size: 32px;
    font-weight: 800;
    color: var(--text-main);
    line-height: 1.2;
    margin: 4px 0;
    font-family: 'Outfit', sans-serif;
}

.stat-value.highlight {
    color: var(--primary);
}

.stat-sub {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
}

.usage-progress-container {
    padding: 0 4px;
}

.progress-labels {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 12px;
}

.progress-bar-bg {
    height: 12px;
    background: var(--bg-main);
    border-radius: 100px;
    overflow: hidden;
    border: 1px solid var(--border-subtle);
}

.progress-bar-fill {
    height: 100%;
    border-radius: 100px;
    transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.progress-bar-fill.safe { background: var(--success); }
.progress-bar-fill.warning { background: var(--warning); }
.progress-bar-fill.critical { background: var(--danger); }

.subscription-history-section {
    margin-top: 12px;
}

.sub-section-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 20px;
    color: var(--text-main);
}

.compact-table .data-table td {
    padding: 12px 16px;
    font-size: 13px;
}

.status-pill {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
}

.status-pill.active { background: #ecfdf5; color: #059669; }
.status-pill.expired { background: #fef2f2; color: #dc2626; }
.status-pill.over { background: #fffbeb; color: #d97706; }

.no-sub-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 40px;
}

.mt-4 { margin-top: 16px; }
</style>

