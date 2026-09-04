import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import InsuranceCompanyDashboard from './pages/InsuranceCompanyDashboard';
import InsuranceCompanyProfilePage from './pages/InsuranceCompanyProfilePage';
import InsuranceCompaniesPage from './pages/InsuranceCompaniesPage';
import UserManagementPage from './pages/UserManagementPage';
import ArAgingPage from './pages/ArAgingPage';
import CreateClaimPage from './pages/CreateClaimPage';
import ClaimsListPage from './pages/ClaimsListPage';
import ClaimDetailPage from './pages/ClaimDetailPage';
import PaymentsPage from './pages/PaymentsPage';
import AlertCenterPage from './pages/AlertCenterPage';
import AnalyticsPage from './pages/AnalyticsPage';

import { getActiveAlerts } from './services/api';

function RoleRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'INSURANCE_COMPANY') {
    return <Navigate to="/insurance/dashboard" replace />;
  }
  return <Navigate to="/admin/dashboard" replace />;
}

function AuthenticatedAppShell({ children, onRefresh, isRefreshing, activeAlertCount, refreshKey }) {
  return (
    <div className="app-container">
      <Sidebar activeAlertCount={activeAlertCount} />
      <div className="main-content">
        <Header
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          activeAlertCount={activeAlertCount}
        />
        <main key={refreshKey} style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function MainRoutes() {
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { isAuthenticated } = useAuth();

  const fetchAlertsCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await getActiveAlerts();
      if (Array.isArray(res.data)) {
        setActiveAlertCount(res.data.length);
      }
    } catch {
      // Backend may be starting or offline
    }
  };

  useEffect(() => {
    fetchAlertsCount();
    const interval = setInterval(fetchAlertsCount, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleGlobalRefresh = () => {
    setIsRefreshing(true);
    fetchAlertsCount();
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <Routes>
      {/* Public Authentication Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Root Path Redirects to Role Specific Dashboard */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Authenticated Application Shell */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AuthenticatedAppShell
              onRefresh={handleGlobalRefresh}
              isRefreshing={isRefreshing}
              activeAlertCount={activeAlertCount}
              refreshKey={refreshKey}
            >
              <Routes>
                {/* RCM Admin Routes */}
                <Route
                  path="admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['RCM_ADMIN']}>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="insurance-companies"
                  element={
                    <ProtectedRoute allowedRoles={['RCM_ADMIN']}>
                      <InsuranceCompaniesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['RCM_ADMIN']}>
                      <UserManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="create-claim"
                  element={
                    <ProtectedRoute allowedRoles={['RCM_ADMIN']}>
                      <CreateClaimPage />
                    </ProtectedRoute>
                  }
                />

                {/* Insurance Company Routes */}
                <Route
                  path="insurance/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['INSURANCE_COMPANY']}>
                      <InsuranceCompanyDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="insurance/profile"
                  element={
                    <ProtectedRoute allowedRoles={['INSURANCE_COMPANY']}>
                      <InsuranceCompanyProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Shared Multi-Tenant Operations (Data isolated by role and tenant) */}
                <Route path="ar-aging" element={<ArAgingPage />} />
                <Route path="claims" element={<ClaimsListPage />} />
                <Route path="claims/:id" element={<ClaimDetailPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="alerts" element={<AlertCenterPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />

                {/* Catch-all redirect */}
                <Route path="*" element={<RoleRedirect />} />
              </Routes>
            </AuthenticatedAppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
