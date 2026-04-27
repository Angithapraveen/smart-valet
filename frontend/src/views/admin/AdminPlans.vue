<template>
  <div class="dashboard-page animate-fade-in">
    <div class="dashboard-header">
      <h1>Subscription Management</h1>
      
    </div>

    <!-- Summary Cards (Home Page Style) -->
    <div class="summary-cards">
      <div class="summary-card locations-card">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
        </div>
        <div class="card-content">
          <div class="card-label">Defined Tiers</div>
          <div class="card-value">{{ plans.length }}</div>
        </div>
      </div>

      <div class="summary-card owners-card">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="22 14 19 11 16 14"></polyline></svg>
        </div>
        <div class="card-content">
          <div class="card-label">Active Deployments</div>
          <div class="card-value">{{ activeSubscriptionsCount }}</div>
        </div>
      </div>

      <div class="summary-card managers-card">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        </div>
        <div class="card-content">
          <div class="card-label">Gross Revenue</div>
          <div class="card-value">₹{{ totalRevenue }}</div>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="tabs-container mb-8">
      <div class="tabs">
        <button 
          @click="activeTab = 'planDetails'"
          :class="['tab-btn', { active: activeTab === 'planDetails' }]"
        >
          Plan Details
        </button>
        <button 
          @click="activeTab = 'liveSubscriptions'"
          :class="['tab-btn', { active: activeTab === 'liveSubscriptions' }]"
        >
          Live Subscriptions
        </button>
        <button 
          @click="activeTab = 'revenueLedger'"
          :class="['tab-btn', { active: activeTab === 'revenueLedger' }]"
        >
          Revenue Ledger
        </button>
      </div>
    </div>

    <!-- Tab 1: Plan Details (Architecture Management) -->
    <div v-if="activeTab === 'planDetails'" class="animate-fade-in">
      <div class="locations-section">
        <div class="section-header">
          <div class="header-main-info">
            <h2>Architecture Management</h2>
          </div>
        </div>
        
               <div class="p-10 space-y-24"> <!-- Spacious vertical separation -->
          
          <!-- Create Plan Section -->
          <div class="w-full">
            <div class="card bg-main border-subtle h-full shadow-none overflow-visible">
              <div class="p-10">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--border-subtle);">
                  <div style="width: 48px; height: 48px; border-radius: 12px; background-color: rgba(99, 102, 241, 0.1); display: flex; align-items: center; justify-content: center; color: var(--primary);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  </div>
                  <div>
                    <h3 style="font-size: 22px; font-weight: 800; color: var(--text-main); margin: 0; line-height: 1.2;">Initialize New Tier</h3>
                    <p style="font-size: 13px; color: var(--text-muted); margin: 4px 0 0 0; font-weight: 500;">Define a new subscription model for your locations</p>
                  </div>
                </div>

                <form @submit.prevent="handleCreatePlan" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                  
                  <!-- Row 1: Plan Identity & Total Transactions -->
                  <div class="form-group" style="margin: 0;">
                    <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Plan Identity</label>
                    <input 
                      v-model="newPlan.plan_name" 
                      type="text" 
                      placeholder="e.g. Enterprise Tier" 
                      class="form-input h-12 w-full" 
                      required 
                    />
                  </div>
                  <div class="form-group" style="margin: 0;">
                    <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Total Transactions</label>
                    <input 
                      v-model.number="newPlan.total_transactions" 
                      type="number" 
                      placeholder="5000" 
                      class="form-input h-12 w-full" 
                      required 
                    />
                  </div>

                  <!-- Row 2: Duration & Valuation -->
                  <div class="form-group" style="margin: 0;">
                    <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Duration (Months)</label>
                    <input 
                      v-model.number="newPlan.duration_months" 
                      type="number" 
                      placeholder="12" 
                      class="form-input h-12 w-full" 
                      required 
                    />
                  </div>
                  <div class="form-group" style="margin: 0;">
                    <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Valuation (Price)</label>
                    <div style="position: relative; display: flex; align-items: center;">
                      <div style="position: absolute; left: 16px; color: var(--text-muted); font-weight: bold; font-size: 14px; pointer-events: none;">₹</div>
                      <input 
                        v-model.number="newPlan.price" 
                        type="number" 
                        step="0.01" 
                        class="form-input w-full" 
                        style="padding-left: 36px; font-weight: bold; height: 48px;" 
                        placeholder="0.00" 
                        required 
                      />
                    </div>
                  </div>

                  <!-- Row 3: Plan Status -->
                  <div class="form-group" style="margin: 0;">
                    <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Default Status</label>
                    <select v-model="newPlan.status" class="form-input h-12 w-full bg-main">
                      <option value="draft">Draft (Private)</option>
                      <option value="active">Active (Visible)</option>
                      <option value="inactive">Inactive (Hidden)</option>
                    </select>
                  </div>

                  <!-- Multi-Action Buttons -->
                  <div style="display: flex; gap: 16px; justify-content: flex-end; align-items: flex-end;">
                    <button 
                      type="button" 
                      @click="handleCreatePlan('draft')"
                      :disabled="loading" 
                      class="btn btn-outline"
                      style="padding: 12px 32px;"
                    >
                      <span v-if="!loading">Save as Draft</span>
                      <div v-else class="spinner-sm"></div>
                    </button>
                    <button 
                      type="button" 
                      @click="handleCreatePlan('active')"
                      :disabled="loading" 
                      class="btn btn-primary"
                      style="padding: 12px 32px;"
                    >
                      <span v-if="!loading">Publish Plan</span>
                      <div v-else class="spinner-sm"></div>
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>

          <!-- Plans List Section -->
          <div class="w-full">
            <div class="card bg-main border-subtle p-0 overflow-hidden h-full shadow-none">
              <div class="p-10 border-b border-subtle">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                  <div style="width: 48px; height: 48px; border-radius: 12px; background-color: rgba(59, 130, 246, 0.1); display: flex; align-items: center; justify-content: center; color: var(--info);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                  </div>
                  <div>
                    <h3 style="font-size: 22px; font-weight: 800; color: var(--text-main); margin: 0; line-height: 1.2;">Service Tiers Ledger</h3>
                    <p style="font-size: 13px; color: var(--text-muted); margin: 4px 0 0 0; font-weight: 500;">Manage and filter existing subscription architectures</p>
                  </div>
                </div>
              </div>
                
                <!-- Filters Bar (Matches Initialize New Tier Style) -->
                <div style="background-color: var(--bg-main); padding: 32px; border-radius: 16px; border: 1px solid var(--border-subtle); margin-bottom: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                  <!-- Row 1: Name & Status -->
                  <div class="form-group" style="margin: 0;">
                    <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Plan Name</label>
                    <input v-model="tempFilters.name" type="text" placeholder="Search plans..." class="form-input" style="height: 48px; width: 100%;" />
                  </div>
                  <div class="form-group" style="margin: 0;">
                    <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Lifecycle Status</label>
                    <select v-model="tempFilters.status" class="form-input" style="height: 48px; width: 100%; background-color: var(--bg-main);">
                      <option value="all">All Statuses</option>
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  <!-- Row 2: Price & Capacity -->
                  <div class="form-group" style="margin: 0;">
                    <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Valuation Range (₹)</label>
                    <div class="range-group">
                      <input v-model.number="tempFilters.minPrice" type="number" placeholder="Min Price" class="form-input range-input" style="height: 40px; font-size: 12px;" />
                      <span style="color: var(--text-muted); font-weight: bold; font-size: 12px; flex-shrink: 0;">-</span>
                      <input v-model.number="tempFilters.maxPrice" type="number" placeholder="Max Price" class="form-input range-input" style="height: 40px; font-size: 12px;" />
                    </div>
                  </div>
                  <div class="form-group" style="margin: 0;">
                    <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Capacity Range (txn)</label>
                    <div class="range-group">
                      <input v-model.number="tempFilters.minTransactions" type="number" placeholder="Min Txn" class="form-input range-input" style="height: 40px; font-size: 12px;" />
                      <span style="color: var(--text-muted); font-weight: bold; font-size: 12px; flex-shrink: 0;">-</span>
                      <input v-model.number="tempFilters.maxTransactions" type="number" placeholder="Max Txn" class="form-input range-input" style="height: 40px; font-size: 12px;" />
                    </div>
                  </div>

                  <!-- Row 3: Action Buttons -->
                  <div style="grid-column: 1 / -1; display: flex; gap: 16px; justify-content: flex-start; margin-top: 16px;">
                    <button @click="applyFilters" class="btn btn-primary" style="width: 180px; height: 44px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px;">
                      Apply Filters
                    </button>
                    <button @click="resetFilters" class="btn btn-outline" style="width: 180px; height: 44px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px;">
                      Reset All
                    </button>
                  </div>
                </div>
              <div class="table-container border-none rounded-none w-full">
                <table class="table" style="width: 100%; table-layout: fixed;">
                  <thead>
                    <tr>
                      <th style="width: 20%; padding-left: 24px;">Tier Name</th>
                      <th style="width: 14%; text-align: center;">Capacity</th>
                      <th style="width: 14%; text-align: center;">Duration</th>
                      <th style="width: 14%; text-align: center;">Valuation</th>
                      <th style="width: 12%; text-align: center;">Status</th>
                      <th style="width: 26%; text-align: right; padding-right: 24px;">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="plan in filteredPlans" :key="plan.plan_id">
                      <td class="font-bold truncate" style="padding-left: 24px;">{{ plan.plan_name }}</td>
                      <td style="text-align: center;">{{ plan.total_transactions }} txn</td>
                      <td style="text-align: center;">{{ plan.duration_months }} Months</td>
                      <td class="font-bold text-primary" style="text-align: center;">₹{{ plan.price }}</td>
                      <td style="text-align: center;">
                        <span :class="getStatusBadgeClass(plan.status)" class="badge uppercase text-[10px]">
                          {{ plan.status }}
                        </span>
                      </td>
                      <td style="text-align: right; padding-right: 24px;">
                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                          <button @click="openAssignModal(plan)" class="btn btn-primary py-1.5 px-3 text-xs whitespace-nowrap" :disabled="plan.status !== 'active'">Assign</button>
                          <button @click="openEditModal(plan)" class="btn btn-outline py-1.5 px-3 text-xs text-primary hover:bg-primary-light whitespace-nowrap">Edit</button>
                          <button @click="togglePlanStatus(plan)" class="btn btn-outline py-1.5 px-3 text-xs whitespace-nowrap">
                            {{ plan.status === 'active' ? 'Deactivate' : 'Activate' }}
                          </button>
                          <button @click="handleDeletePlan(plan.plan_id)" class="btn btn-outline py-1.5 px-3 text-xs text-danger hover:bg-danger-light whitespace-nowrap">Delete</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Live Subscriptions -->
    <div v-if="activeTab === 'liveSubscriptions'" class="animate-fade-in">
      <div class="p-10">
        <div class="card bg-main border-subtle p-0 overflow-hidden shadow-none">
          <div class="p-10 border-b border-subtle">
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
              <div style="width: 48px; height: 48px; border-radius: 12px; background-color: rgba(16, 185, 129, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success);">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <h3 style="font-size: 22px; font-weight: 800; color: var(--text-main); margin: 0; line-height: 1.2;">Live Deployments Registry</h3>
                <p style="font-size: 13px; color: var(--text-muted); margin: 4px 0 0 0; font-weight: 500;">Monitoring active subscription terms across all locations</p>
              </div>
            </div>
          </div>

          <!-- Subscription Filters -->
          <div style="background-color: var(--bg-main); padding: 32px; border-bottom: 1px solid var(--border-subtle);">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
              <div class="form-group" style="margin: 0;">
                <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Search Location</label>
                <input v-model="tempSubFilters.location" type="text" placeholder="Search by location..." class="form-input" style="height: 48px; width: 100%;" />
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Assigned Tier</label>
                <select v-model="tempSubFilters.plan" class="form-input" style="height: 48px; width: 100%; background-color: var(--bg-main);">
                  <option value="all">All Tiers</option>
                  <option v-for="plan in plans" :key="plan.plan_id" :value="plan.plan_name">{{ plan.plan_name }}</option>
                </select>
              </div>
              <div class="form-group" style="margin: 0;">
                <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Lifecycle Status</label>
                <select v-model="tempSubFilters.status" class="form-input" style="height: 48px; width: 100%; background-color: var(--bg-main);">
                  <option value="all">All States</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
              <div style="display: flex; gap: 16px; align-items: flex-end;">
                <button @click="applySubFilters" class="btn btn-primary" style="width: 140px; height: 48px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px;">
                  Apply
                </button>
                <button @click="resetSubFilters" class="btn btn-outline" style="width: 140px; height: 48px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; font-size: 13px;">
                  Reset
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="filteredSubscriptions.length > 0" class="table-container border-none rounded-none">
            <table class="table">
              <thead>
                <tr>
                  <th class="pl-10">Location</th>
                  <th>Assigned Tier</th>
                  <th>Term End Date</th>
                  <th class="text-center pr-10">Lifecycle State</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sub in filteredSubscriptions" :key="sub.subscription_id">
                  <td class="font-extrabold pl-10 text-main">{{ sub.location_name }}</td>
                  <td>
                    <span 
                      @click="openViewPlanModal(sub.plan_name)"
                      class="badge bg-info/10 text-info border-info/20 uppercase text-[10px] px-3 font-bold cursor-pointer hover:bg-info/20 transition-all active:scale-95"
                      title="Click to view plan details"
                    >
                      {{ sub.plan_name }}
                    </span>
                  </td>
                  <td class="text-muted font-medium">{{ formatDate(sub.end_date) }}</td>
                  <td class="text-center pr-10">
                    <span :class="sub.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'" class="badge uppercase text-[10px] px-3 font-bold">
                      {{ sub.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Empty State -->
          <div v-else class="p-20 flex flex-col items-center justify-center text-center">
            <div class="w-16 h-16 bg-main rounded-full flex items-center justify-center mb-4 border border-subtle">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <h4 class="text-lg font-bold">No Active Deployments</h4>
            <p class="text-sm text-muted max-w-xs mt-2">Initialize a new subscription by assigning a tier to a location in the Architecture tab.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 3: Revenue Ledger -->
    <div v-if="activeTab === 'revenueLedger'" class="animate-fade-in">
      <div class="p-10">
        <div class="card bg-main border-subtle p-0 overflow-hidden shadow-none">
          <div class="p-10 border-b border-subtle">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-warning-light flex items-center justify-center text-warning">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <div>
                <h3 class="text-xl font-extrabold text-main leading-tight">Financial Transaction Logs</h3>
                <p class="text-xs text-muted mt-1 font-medium">Historical record of all subscription-based revenue</p>
              </div>
            </div>
          </div>
          
          <div v-if="payments.length > 0" class="table-container border-none rounded-none">
            <table class="table">
              <thead>
                <tr>
                  <th class="pl-10">Beneficiary Location</th>
                  <th class="text-right">Valuation Amount</th>
                  <th>Settlement Timestamp</th>
                  <th class="text-center pr-10">Payment State</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="payment in payments" :key="payment.payment_id">
                  <td class="font-extrabold pl-10 text-main">{{ payment.location_name }}</td>
                  <td class="font-black text-success text-right">₹{{ payment.amount }}</td>
                  <td class="text-muted font-medium">{{ formatDate(payment.created_at) }}</td>
                  <td class="text-center pr-10">
                    <span class="badge badge-success uppercase text-[10px] px-3 font-bold">
                      {{ payment.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Empty State -->
          <div v-else class="p-20 flex flex-col items-center justify-center text-center">
            <div class="w-16 h-16 bg-main rounded-full flex items-center justify-center mb-4 border border-subtle">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h4 class="text-lg font-bold">No Financial History</h4>
            <p class="text-sm text-muted max-w-xs mt-2">Revenue records will appear here as soon as subscription settlements are processed.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div v-if="assignModal.show" class="modal-overlay glass animate-fade-in" @click.self="assignModal.show = false">
      <div class="modal-content animate-slide-up">
        <div class="modal-header">
          <div>
            <h3 class="text-xl font-bold">Assign {{ assignModal.plan?.plan_name }}</h3>
            <p class="text-xs text-muted mt-1">Provision this tier to a specific location</p>
          </div>
          <button @click="assignModal.show = false" class="p-2 hover:bg-main rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div class="modal-body space-y-6">
          <div class="form-group">
            <label class="form-label">Target Location</label>
            <select v-model="assignModal.location_id" class="form-input w-full">
              <option value="" disabled>Choose a location...</option>
              <option v-for="loc in locations" :key="loc.location_id" :value="loc.location_id">{{ loc.location_name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Activation Timestamp</label>
            <input v-model="assignModal.start_date" type="date" class="form-input w-full" />
          </div>
          <div class="pt-4">
            <button @click="handleAssign" :disabled="!assignModal.location_id || !assignModal.start_date || loading" class="btn btn-primary w-full py-4 text-sm font-bold uppercase tracking-wider">
              <span v-if="!loading">Initialize Provisioning</span>
              <div v-else class="spinner-sm"></div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- EDIT MODAL -->
    <div v-if="editModal.show" class="modal-overlay glass animate-fade-in" @click.self="editModal.show = false">
      <div class="modal-content animate-slide-up max-w-2xl">
        <div class="modal-header">
          <div>
            <h3 class="text-xl font-bold">Edit {{ editModal.plan?.plan_name }}</h3>
            <p class="text-xs text-muted mt-1">Modify the specifications for this service tier</p>
          </div>
          <button @click="editModal.show = false" class="p-2 hover:bg-main rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="form-group col-span-full">
              <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Plan Identity</label>
              <input v-model="editModal.form.plan_name" type="text" class="form-input w-full" />
            </div>
            
            <div class="form-group">
              <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Total Transactions</label>
              <input v-model.number="editModal.form.total_transactions" type="number" class="form-input w-full" />
            </div>
            
            <div class="form-group">
              <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Duration (Months)</label>
              <input v-model.number="editModal.form.duration_months" type="number" class="form-input w-full" />
            </div>
            
            <div class="form-group">
              <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Valuation (Price)</label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span class="text-muted font-bold text-sm">₹</span>
                </div>
                <input v-model.number="editModal.form.price" type="number" step="0.01" class="form-input pl-10 font-bold w-full" />
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label text-[10px] font-bold text-muted uppercase tracking-wider mb-2 block">Plan Status</label>
              <select v-model="editModal.form.status" class="form-input w-full bg-main">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          
          <div class="pt-8 border-t border-subtle mt-8 flex gap-4">
            <button @click="editModal.show = false" class="btn btn-outline flex-1 py-4 text-sm font-bold">Cancel</button>
            <button @click="handleUpdatePlan" :disabled="loading" class="btn btn-primary flex-1 py-4 text-sm font-bold uppercase tracking-wider">
              <span v-if="!loading">Save Changes</span>
              <div v-else class="spinner-sm"></div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- VIEW PLAN DETAILS MODAL -->
    <div v-if="viewPlanModal.show" class="modal-overlay glass animate-fade-in" @click.self="viewPlanModal.show = false">
      <div class="modal-content animate-slide-up max-w-md">
        <!-- Header with Icon and Status -->
        <div class="modal-header border-b border-subtle pb-6 mb-8 flex justify-between items-start">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h3 class="text-2xl font-black text-main tracking-tight leading-none">{{ viewPlanModal.plan?.plan_name }}</h3>
                <span :class="getStatusBadgeClass(viewPlanModal.plan?.status)" class="badge uppercase text-[9px] px-2 py-0.5 font-bold">
                  {{ viewPlanModal.plan?.status }}
                </span>
              </div>
              <p class="text-[10px] text-muted mt-2 font-bold uppercase tracking-widest">Plan Specifications Overview</p>
            </div>
          </div>
          <button @click="viewPlanModal.show = false" class="p-2 hover:bg-main rounded-xl border border-subtle transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div class="modal-body pt-0">
          <!-- Specification List: Label : Value Format -->
          <div class="space-y-4 px-2">
            <div class="flex items-center justify-between py-3 border-b border-subtle/50">
              <span class="text-sm font-bold text-muted">Transaction Capacity :</span>
              <span class="text-sm font-black text-main">{{ viewPlanModal.plan?.total_transactions }} <span class="text-[10px] text-muted font-bold">txn</span></span>
            </div>
            
            <div class="flex items-center justify-between py-3 border-b border-subtle/50">
              <span class="text-sm font-bold text-muted">Contract Duration :</span>
              <span class="text-sm font-black text-main">{{ viewPlanModal.plan?.duration_months }} <span class="text-[10px] text-muted font-bold">Months</span></span>
            </div>
            
            <div class="flex items-center justify-between py-3 border-b border-subtle/50">
              <span class="text-sm font-bold text-muted">Plan Valuation :</span>
              <span class="text-sm font-black text-success">₹{{ viewPlanModal.plan?.price }}</span>
            </div>
          </div>
          
          <div class="mt-10">
            <button @click="viewPlanModal.show = false" class="btn btn-primary w-full py-5 text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/10 rounded-2xl">
              Return to Registry
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../../stores/auth';
import { useToast } from '../../stores/toast';
import { SubscriptionService } from '../../services/SubscriptionService';

const authStore = useAuthStore();
const toast = useToast();
const plans = ref([]);
const subscriptions = ref([]);
const payments = ref([]);
const locations = ref([]);
const loading = ref(false);
const activeTab = ref('planDetails');

const activeSubscriptionsCount = computed(() => 
  subscriptions.value.filter(s => s.status === 'ACTIVE').length
);

const totalRevenue = computed(() => 
  payments.value.reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString('en-IN')
);

const newPlan = reactive({
  plan_name: '',
  total_transactions: null,
  duration_months: null,
  price: null,
  status: 'draft'
});

const assignModal = reactive({
  show: false,
  plan: null,
  location_id: '',
  start_date: new Date().toISOString().split('T')[0]
});

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const tempFilters = reactive({
  name: '',
  minPrice: null,
  maxPrice: null,
  minTransactions: null,
  maxTransactions: null,
  status: 'all'
});

const appliedFilters = reactive({ ...tempFilters });

const tempSubFilters = reactive({
  location: '',
  plan: 'all',
  status: 'all'
});

const appliedSubFilters = reactive({ ...tempSubFilters });

const applyFilters = () => {
  Object.assign(appliedFilters, JSON.parse(JSON.stringify(tempFilters)));
};

const applySubFilters = () => {
  Object.assign(appliedSubFilters, JSON.parse(JSON.stringify(tempSubFilters)));
};

const resetFilters = () => {
  Object.assign(tempFilters, {
    name: '',
    minPrice: null,
    maxPrice: null,
    minTransactions: null,
    maxTransactions: null,
    status: 'all'
  });
  applyFilters();
};

const resetSubFilters = () => {
  Object.assign(tempSubFilters, {
    location: '',
    plan: 'all',
    status: 'all'
  });
  applySubFilters();
};

const filteredPlans = computed(() => {
  return plans.value.filter(plan => {
    const matchesName = plan.plan_name.toLowerCase().includes(appliedFilters.name.toLowerCase());
    const matchesMinPrice = appliedFilters.minPrice === null || plan.price >= appliedFilters.minPrice;
    const matchesMaxPrice = appliedFilters.maxPrice === null || plan.price <= appliedFilters.maxPrice;
    const matchesMinTxn = appliedFilters.minTransactions === null || plan.total_transactions >= appliedFilters.minTransactions;
    const matchesMaxTxn = appliedFilters.maxTransactions === null || plan.total_transactions <= appliedFilters.maxTransactions;
    const matchesStatus = appliedFilters.status === 'all' || plan.status === appliedFilters.status;
    
    return matchesName && matchesMinPrice && matchesMaxPrice && matchesMinTxn && matchesMaxTxn && matchesStatus;
  });
});

const filteredSubscriptions = computed(() => {
  return subscriptions.value.filter(sub => {
    const matchesLocation = sub.location_name.toLowerCase().includes(appliedSubFilters.location.toLowerCase());
    const matchesPlan = appliedSubFilters.plan === 'all' || sub.plan_name === appliedSubFilters.plan;
    const matchesStatus = appliedSubFilters.status === 'all' || sub.status === appliedSubFilters.status;
    
    return matchesLocation && matchesPlan && matchesStatus;
  });
});

const editModal = reactive({
  show: false,
  plan: null,
  form: {
    plan_name: '',
    total_transactions: null,
    duration_months: null,
    price: null,
    status: ''
  }
});

const viewPlanModal = reactive({
  show: false,
  plan: null
});

const openViewPlanModal = (planName) => {
  const plan = plans.value.find(p => p.plan_name === planName);
  if (plan) {
    viewPlanModal.plan = plan;
    viewPlanModal.show = true;
  } else {
    toast.error('Detailed tier specifications could not be retrieved');
  }
};

const fetchData = async () => {
  try {
    const [plansRes, subsRes, paymentsRes, locationsRes] = await Promise.all([
      SubscriptionService.getPlans(),
      SubscriptionService.getAllSubscriptions(),
      SubscriptionService.getAllPayments(),
      axios.get(`${API_BASE_URL}/admin/locations`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
    ]);

    plans.value = plansRes.data;
    subscriptions.value = subsRes.data;
    payments.value = paymentsRes.data;
    locations.value = locationsRes.data.data;
  } catch (error) {
    console.error('Fetch Error:', error);
  }
};

const handleCreatePlan = async (statusOverride) => {
  // Manual Validation
  if (!newPlan.plan_name || !newPlan.total_transactions || !newPlan.duration_months || !newPlan.price) {
    toast.error('Please fill in all required fields');
    return;
  }

  loading.value = true;
  try {
    const payload = { 
      ...newPlan, 
      status: statusOverride || newPlan.status 
    };
    await SubscriptionService.createPlan(payload);
    toast.success('Plan initialized successfully');
    
    // Reset Form
    Object.assign(newPlan, {
      plan_name: '',
      total_transactions: null,
      duration_months: null,
      price: null,
      status: 'draft'
    });
    
    await fetchData();
  } catch (err) {
    toast.error('Plan creation failed');
  } finally {
    loading.value = false;
  }
};

const togglePlanStatus = async (plan) => {
  const newStatus = plan.status === 'active' ? 'inactive' : 'active';
  try {
    await SubscriptionService.updatePlanStatus(plan.plan_id, newStatus);
    toast.success(`Plan marked as ${newStatus}`);
    await fetchData();
  } catch (error) {
    toast.error('Status update failed');
  }
};

const getStatusBadgeClass = (status) => {
  const s = status?.toLowerCase();
  if (s === 'active') return 'badge-success';
  if (s === 'inactive') return 'badge-warning';
  if (s === 'expired') return 'badge-danger';
  if (s === 'draft') return 'badge-secondary';
  return 'badge-info';
};

const handleDeletePlan = async (id) => {
  if (!confirm('Are you sure you want to delete this plan?')) return;
  try {
    await axios.delete(`${API_BASE_URL}/subscriptions/plans/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    toast.success('Plan deleted successfully');
    await fetchData();
  } catch (error) {
    toast.error(error.response?.data?.message || 'Delete failed');
  }
};

const openAssignModal = (plan) => {
  assignModal.plan = plan;
  assignModal.show = true;
};

const openEditModal = (plan) => {
  editModal.plan = plan;
  editModal.form = { ...plan };
  editModal.show = true;
};

const handleUpdatePlan = async () => {
  if (!editModal.form.plan_name || !editModal.form.total_transactions || !editModal.form.duration_months || !editModal.form.price) {
    toast.error('Please fill in all required fields');
    return;
  }

  loading.value = true;
  try {
    await SubscriptionService.updatePlan(editModal.plan.plan_id, editModal.form);
    toast.success('Plan updated successfully');
    editModal.show = false;
    await fetchData();
  } catch (error) {
    toast.error(error.response?.data?.message || 'Update failed');
  } finally {
    loading.value = false;
  }
};

const handleAssign = async () => {
  loading.value = true;
  try {
    await SubscriptionService.assignPlan({
      location_id: assignModal.location_id,
      plan_id: assignModal.plan.plan_id,
      start_date: assignModal.start_date
    });
    toast.success('Plan assigned successfully');
    assignModal.show = false;
    await fetchData();
  } catch (error) {
    toast.error(error.response?.data?.message || 'Assignment failed');
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const refreshData = () => fetchData();

onMounted(fetchData);
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.spinner-sm {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.text-danger {
  color: var(--danger);
}

.bg-main {
  background-color: var(--bg-main);
}

.border-subtle {
  border-color: var(--border-subtle);
}

.badge-secondary { background: #6b7280; color: white; }
.badge-warning { background: #f59e0b; color: white; }

.locations-section {
  background: var(--bg-card);
  border-radius: 24px;
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-subtle);
}

.header-main-info h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  margin: 0;
}

/* Summary Cards (from Home Page) */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.summary-card {
  padding: 16px 20px;
  border-radius: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  transition: var(--ts-base);
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary);
  background: linear-gradient(to bottom right, var(--bg-card), var(--bg-main));
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.locations-card .card-icon { background: var(--primary-light); color: var(--primary); }
.owners-card .card-icon { background: var(--success-light); color: var(--success); }
.managers-card .card-icon { background: var(--warning-light); color: var(--warning); }
.drivers-card .card-icon { background: var(--info-light); color: var(--info); }

.card-content { flex: 1; }
.card-label { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; }
.card-value { font-size: 24px; font-weight: 800; color: var(--text-main); line-height: 1; font-family: 'Outfit', sans-serif; }

/* Custom Form Grid to force 2-columns */
.admin-form-grid {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 24px !important;
  width: 100% !important;
}

.col-span-full {
  grid-column: span 2 / span 2 !important;
}

.form-group {
  margin-bottom: 0 !important;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  margin-bottom: 0 !important;
}

.form-input {
  height: 48px;
  display: flex;
  align-items: center;
}

select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.25rem;
  padding-right: 2.5rem;
}

.range-group {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 12px !important;
  flex-wrap: nowrap !important;
  width: 100% !important;
}

.range-input {
  flex: 1 !important;
  min-width: 0 !important;
  width: 0 !important;
}

/* Tabs Styling */
.tabs-container {
  border-bottom: 1px solid var(--border-subtle);
}

.tabs {
  display: flex;
  gap: 32px;
}

.tab-btn {
  padding: 12px 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  position: relative;
  transition: all 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;
}

.tab-btn:hover {
  color: var(--text-main);
}

.tab-btn.active {
  color: var(--primary);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary);
}

/* Modal Styling */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--bg-card);
  border-radius: 24px;
  border: 1px solid var(--border-subtle);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 480px;
  overflow: hidden;
}

.modal-header {
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 32px;
}

.animate-slide-up {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
