import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import CreateClaimPage from './pages/CreateClaimPage';
import ClaimsListPage from './pages/ClaimsListPage';
import ClaimDetailPage from './pages/ClaimDetailPage';
import PaymentsPage from './pages/PaymentsPage';
import AlertCenterPage from './pages/AlertCenterPage';
import AnalyticsPage from './pages/AnalyticsPage';
import { getActiveAlerts } from './services/api';

export default function App() {
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchAlertsCount = async () => {
    try {
      const res = await getActiveAlerts();
      setActiveAlertCount(res.data.length);
    } catch {
      // Backend may be starting up
    }
  };

  useEffect(() => {
    fetchAlertsCount();
    const interval = setInterval(fetchAlertsCount, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleGlobalRefresh = () => {
    setIsRefreshing(true);
    fetchAlertsCount();
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <Sidebar activeAlertCount={activeAlertCount} />

        <div className="main-content">
          <Header
            onRefresh={handleGlobalRefresh}
            isRefreshing={isRefreshing}
            activeAlertCount={activeAlertCount}
          />

          <main key={refreshKey} style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/create-claim" element={<CreateClaimPage />} />
              <Route path="/claims" element={<ClaimsListPage />} />
              <Route path="/denied-claims" element={<ClaimsListPage />} />
              <Route path="/claims/:id" element={<ClaimDetailPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/alerts" element={<AlertCenterPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
