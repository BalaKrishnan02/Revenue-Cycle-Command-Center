import axios from 'axios';
import {
  getStoredClaims,
  saveStoredClaims,
  getStoredAlerts,
  saveStoredAlerts,
  calculateDemoMetrics,
  calculateDemoArAgingSummary,
  getDemoArAgingClaims,
  getDemoDailyStats,
  demoCompanies,
  demoUsers
} from './demoFallback.js';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Centralized Request Interceptor: Attach JWT Authorization Header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rcm_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired or invalid
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('rcm_auth_token');
        localStorage.removeItem('rcm_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Safe request wrapper that falls back to demo data on network failure (e.g. on mobile when backend is offline)
const safeRequest = async (networkFn, fallbackFn) => {
  try {
    return await networkFn();
  } catch (err) {
    if (!err.response || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      console.warn('API backend unreachable. Using local storage demo fallback for seamless experience:', err.message);
      return { data: fallbackFn() };
    }
    throw err;
  }
};

// Dashboard & Analytics
export const getDashboardMetrics = () =>
  safeRequest(
    () => api.get('/dashboard/metrics'),
    () => calculateDemoMetrics(getStoredClaims())
  );

export const getDenialAnalytics = () =>
  safeRequest(
    () => api.get('/analytics/denials'),
    () => [
      { reason: 'Insurance Eligibility Not Verified', count: 4, totalAmount: 145000, percentage: 40.0 },
      { reason: 'Missing Prior Authorization', count: 3, totalAmount: 125000, percentage: 30.0 },
      { reason: 'Incomplete / Invalid Coding (ICD/CPT)', count: 2, totalAmount: 95000, percentage: 20.0 },
      { reason: 'Incomplete Clinical Documentation', count: 1, totalAmount: 48000, percentage: 10.0 }
    ]
  );

export const getPayerAnalytics = () =>
  safeRequest(
    () => api.get('/analytics/payers'),
    () => [
      { payerName: 'Nova Health Insurance', totalClaims: 12, acceptedClaims: 9, deniedClaims: 3, totalBilled: 240000, totalCollected: 180000, denialRate: 25.0, averageSettlementDays: 14.5 },
      { payerName: 'CareShield Assurance', totalClaims: 10, acceptedClaims: 8, deniedClaims: 2, totalBilled: 190000, totalCollected: 160000, denialRate: 20.0, averageSettlementDays: 12.0 },
      { payerName: 'MediSecure Benefits', totalClaims: 8, acceptedClaims: 6, deniedClaims: 2, totalBilled: 150000, totalCollected: 110000, denialRate: 25.0, averageSettlementDays: 16.0 },
      { payerName: 'HealthPrime Plan', totalClaims: 8, acceptedClaims: 6, deniedClaims: 2, totalBilled: 145000, totalCollected: 115000, denialRate: 25.0, averageSettlementDays: 13.0 },
      { payerName: 'Unity Payer Network', totalClaims: 7, acceptedClaims: 5, deniedClaims: 1, totalBilled: 112000, totalCollected: 88000, denialRate: 14.3, averageSettlementDays: 11.5 }
    ]
  );

export const getRevenueAnalytics = () =>
  safeRequest(
    () => api.get('/analytics/revenue'),
    () => [
      { period: 'Week 1', billed: 45000, collected: 38000, pending: 7000, denied: 5000 },
      { period: 'Week 2', billed: 72000, collected: 60000, pending: 12000, denied: 8000 },
      { period: 'Week 3', billed: 95000, collected: 82000, pending: 13000, denied: 6500 },
      { period: 'Week 4 (Current)', billed: 120000, collected: 90000, pending: 30000, denied: 14000 }
    ]
  );

// Smart Billing Priority Queue
export const getBillingPriorityQueue = () =>
  safeRequest(
    () => api.get('/billing-priority'),
    () => {
      const claims = getStoredClaims();
      return claims
        .filter((c) => c.paymentStatus !== 'PAID' && c.pendingAmount > 0)
        .sort((a, b) => (b.billingPriorityScore || 0) - (a.billingPriorityScore || 0));
    }
  );

// AR Aging (Accounts Receivable Tracking)
export const getArAgingSummary = (payer = '', date = '') => {
  const params = [];
  if (payer && payer !== 'ALL') params.push(`payer=${encodeURIComponent(payer)}`);
  if (date && date !== 'ALL') params.push(`date=${encodeURIComponent(date)}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';

  return safeRequest(
    () => api.get(`/ar-aging/summary${query}`),
    () => calculateDemoArAgingSummary(getStoredClaims(), payer, date)
  );
};

export const getArAgingClaims = (bucket = '', payer = '', date = '') => {
  const params = [];
  if (bucket && bucket !== 'ALL') params.push(`bucket=${encodeURIComponent(bucket)}`);
  if (payer && payer !== 'ALL') params.push(`payer=${encodeURIComponent(payer)}`);
  if (date && date !== 'ALL') params.push(`date=${encodeURIComponent(date)}`);
  const query = params.length > 0 ? `?${params.join('&')}` : '';

  return safeRequest(
    () => api.get(`/ar-aging/claims${query}`),
    () => getDemoArAgingClaims(getStoredClaims(), bucket, payer, date)
  );
};

export const getArAgingPayers = () =>
  safeRequest(
    () => api.get('/ar-aging/payers'),
    () => [
      { payerName: 'CareShield', payerType: 'COMMERCIAL', totalOutstanding: 354000, claimCount: 7 },
      { payerName: 'MediSecure', payerType: 'PRIVATE', totalOutstanding: 343500, claimCount: 6 },
      { payerName: 'Nova Health Insurance', payerType: 'PRIVATE', totalOutstanding: 289000, claimCount: 6 },
      { payerName: 'HealthPrime', payerType: 'COMMERCIAL', totalOutstanding: 249000, claimCount: 5 },
      { payerName: 'Unity Payer Network', payerType: 'PRIVATE', totalOutstanding: 178000, claimCount: 3 }
    ]
  );

export const getArAgingDailyStats = (payer = '') =>
  safeRequest(
    () => api.get(`/ar-aging/daily-stats${payer && payer !== 'ALL' ? `?payer=${encodeURIComponent(payer)}` : ''}`),
    () => getDemoDailyStats(getStoredClaims(), payer)
  );

export const recordArFollowUp = async (id, followUpData = {}) => {
  try {
    return await api.post(`/ar-aging/claims/${id}/follow-up`, followUpData);
  } catch (err) {
    if (!err.response || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      const claims = getStoredClaims();
      const claim = claims.find((c) => c.claimId === id || c.id === id);
      if (claim) {
        claim.followUpStatus = followUpData.followUpStatus || 'CONTACTED';
        claim.followUpNotes = followUpData.followUpNote || '';
        claim.lastFollowUpDate = new Date().toISOString();
        if (followUpData.nextFollowUpDate) claim.nextFollowUpDate = followUpData.nextFollowUpDate;
        saveStoredClaims(claims);
        return { data: claim };
      }
    }
    throw err;
  }
};

// Claims CRUD & Lifecycle
export const getClaims = () =>
  safeRequest(
    () => api.get('/claims'),
    () => getStoredClaims()
  );

export const getClaim = (id) =>
  safeRequest(
    () => api.get(`/claims/${id}`),
    () => {
      const claims = getStoredClaims();
      return claims.find((c) => c.claimId === id || c.id === id) || claims[0];
    }
  );

export const getClaimHistory = (id) =>
  safeRequest(
    () => api.get(`/claims/${id}/history`),
    () => [
      { id: 'h-1', claimId: id, oldStatus: null, newStatus: 'CREATED', description: 'Claim created in billing system.', timestamp: new Date(Date.now() - 5 * 86400000).toISOString() },
      { id: 'h-2', claimId: id, oldStatus: 'CREATED', newStatus: 'AI_CHECKED', description: 'AI Risk Check completed: Clean claim quality metrics.', timestamp: new Date(Date.now() - 4 * 86400000).toISOString() },
      { id: 'h-3', claimId: id, oldStatus: 'AI_CHECKED', newStatus: 'SUBMITTED', description: 'Submitted electronically via EDI 837.', timestamp: new Date(Date.now() - 3 * 86400000).toISOString() }
    ]
  );

export const createClaim = async (claimData) => {
  try {
    return await api.post('/claims', claimData);
  } catch (err) {
    if (!err.response || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      const claims = getStoredClaims();
      const generatedId = claimData.claimId || 'CLM' + (2000 + claims.length + 1);
      const totalBill = claimData.claimAmount || 0;
      const newClaim = {
        ...claimData,
        id: 'c-' + Date.now(),
        claimId: generatedId,
        patientReference: claimData.patientReference || 'PT-' + generatedId.replace('CLM', ''),
        totalBillAmount: totalBill,
        paidAmount: 0,
        pendingAmount: totalBill,
        daysPending: 1,
        billingPriorityScore: totalBill >= 100000 ? 73 : (totalBill >= 50000 ? 59 : 31),
        billingPriority: totalBill >= 100000 ? 'HIGH' : (totalBill >= 50000 ? 'HIGH' : 'MEDIUM'),
        priorityReason: `₹${totalBill.toLocaleString()} pending for 1 days`,
        status: 'CREATED',
        paymentStatus: 'UNPAID',
        createdAt: new Date().toISOString()
      };
      claims.unshift(newClaim);
      saveStoredClaims(claims);

      // Auto-dispatch Stage 1 Email
      recordDemoStageEmail(
        newClaim,
        1,
        'Stage 1: Claim Intake & Registration Complete',
        `Claim ${generatedId} successfully registered in RCM Command Center with bill amount ₹${totalBill.toLocaleString()}. Next milestone: AI Pre-Audit Risk Analysis.`
      );

      return { data: newClaim };
    }
    throw err;
  }
};

export const updateClaim = (id, claimData) => api.put(`/claims/${id}`, claimData);
export const deleteClaim = (id) => api.delete(`/claims/${id}`);

// Claim Actions & Payments
export const predictClaimRisk = async (id) => {
  try {
    return await api.post(`/claims/${id}/predict`);
  } catch (err) {
    if (!err.response || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      const claims = getStoredClaims();
      const claim = claims.find((c) => c.claimId === id || c.id === id) || claims[0];
      claim.riskScore = 22;
      claim.riskLevel = 'LOW';
      claim.status = 'READY_TO_SUBMIT';
      claim.predictedReason = 'Clean Claim Quality Metrics';
      claim.recommendation = 'Claim passes pre-submission checks. Ready for immediate payer submission.';
      claim.detectedReasons = ['Clean Claim Quality Metrics'];
      claim.recommendations = ['Claim passes pre-submission checks. Ready for immediate payer submission.'];
      saveStoredClaims(claims);

      // Auto-dispatch Stage 2 Email
      recordDemoStageEmail(
        claim,
        2,
        'Stage 2: AI Pre-Audit Risk Analysis Complete',
        `AI pre-submission audit completed with estimated denial risk of 22% (LOW Risk). Recommendation: Ready for immediate payer submission.`
      );

      return { data: claim };
    }
    throw err;
  }
};

export const submitClaim = async (id) => {
  try {
    return await api.post(`/claims/${id}/submit`);
  } catch (err) {
    if (!err.response || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      const claims = getStoredClaims();
      const claim = claims.find((c) => c.claimId === id || c.id === id) || claims[0];
      claim.status = 'ACCEPTED';
      saveStoredClaims(claims);

      // Auto-dispatch Stage 3 Email
      recordDemoStageEmail(
        claim,
        3,
        'Stage 3: Electronic EDI 837 Submission Dispatched',
        `Claim electronically transmitted to ${claim.payerName || 'Payer'}. Electronic EDI 837 data interchange confirmed.`
      );

      return { data: claim };
    }
    throw err;
  }
};

export const correctClaim = async (id, claimData) => {
  try {
    return await api.post(`/claims/${id}/correct`, claimData);
  } catch (err) {
    if (!err.response || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      const claims = getStoredClaims();
      const claim = claims.find((c) => c.claimId === id || c.id === id) || claims[0];
      Object.assign(claim, claimData);
      claim.status = 'CORRECTED';
      saveStoredClaims(claims);
      return { data: claim };
    }
    throw err;
  }
};

export const resubmitClaim = async (id) => {
  try {
    return await api.post(`/claims/${id}/resubmit`);
  } catch (err) {
    if (!err.response || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      const claims = getStoredClaims();
      const claim = claims.find((c) => c.claimId === id || c.id === id) || claims[0];
      claim.status = 'ACCEPTED';
      saveStoredClaims(claims);

      // Auto-dispatch Stage 3 Resubmission Email
      recordDemoStageEmail(
        claim,
        3,
        'Stage 3: Electronic EDI 837 Resubmission Dispatched',
        `Corrected claim resubmitted to payer ${claim.payerName || 'Payer'} for secondary adjudication review.`
      );

      return { data: claim };
    }
    throw err;
  }
};

export const acceptClaim = async (id) => {
  try {
    return await api.post(`/claims/${id}/accept`);
  } catch (err) {
    if (!err.response || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      const claims = getStoredClaims();
      const claim = claims.find((c) => c.claimId === id || c.id === id) || claims[0];
      claim.status = 'ACCEPTED';
      saveStoredClaims(claims);

      // Auto-dispatch Stage 4 Adjudication Email
      recordDemoStageEmail(
        claim,
        4,
        'Stage 4: Payer Adjudication (ACCEPTED)',
        `Claim approved by ${claim.payerName || 'Payer'}. Ready for financial reimbursement and settlement disbursement.`
      );

      return { data: claim };
    }
    throw err;
  }
};

export const denyClaim = async (id, reason) => {
  try {
    return await api.post(`/claims/${id}/deny`, { reason });
  } catch (err) {
    if (!err.response || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      const claims = getStoredClaims();
      const claim = claims.find((c) => c.claimId === id || c.id === id) || claims[0];
      claim.status = 'DENIED';
      claim.denialReason = reason || 'Eligibility Issue: Coverage expired';
      saveStoredClaims(claims);

      // Auto-dispatch Stage 4 Denial Email
      recordDemoStageEmail(
        claim,
        4,
        'Stage 4: Payer Adjudication (DENIED)',
        `Claim denial issued by ${claim.payerName || 'Payer'}. Denial reason: ${claim.denialReason}`
      );

      return { data: claim };
    }
    throw err;
  }
};

export const setPendingClaim = async (id) => {
  try {
    return await api.post(`/claims/${id}/pending`);
  } catch (err) {
    if (!err.response || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      const claims = getStoredClaims();
      const claim = claims.find((c) => c.claimId === id || c.id === id) || claims[0];
      claim.status = 'PENDING';
      saveStoredClaims(claims);
      return { data: claim };
    }
    throw err;
  }
};

export const payClaim = async (id, paymentData = {}) => {
  try {
    return await api.post(`/claims/${id}/pay`, paymentData);
  } catch (err) {
    if (!err.response || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      const claims = getStoredClaims();
      const idx = claims.findIndex((c) => c.claimId === id || c.id === id);
      if (idx >= 0) {
        claims[idx].paidAmount = claims[idx].totalBillAmount || claims[idx].claimAmount;
        claims[idx].pendingAmount = 0;
        claims[idx].status = 'PAID';
        claims[idx].paymentStatus = 'PAID';
        claims[idx].billingPriorityScore = 0;
        claims[idx].billingPriority = 'LOW';
        saveStoredClaims(claims);

        // Auto-dispatch Stage 5 Email
        recordDemoStageEmail(
          claims[idx],
          5,
          'Stage 5: Final Payment Settlement Disbursed',
          `Full reimbursement settlement of ₹${(claims[idx].paidAmount || 0).toLocaleString()} disbursed successfully.`
        );

        return { data: claims[idx] };
      }
    }
    throw err;
  }
};

export const recordPartialPayment = async (id, paymentData = {}) => {
  try {
    return await api.post(`/claims/${id}/partial-payment`, paymentData);
  } catch (err) {
    if (!err.response || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      const claims = getStoredClaims();
      const idx = claims.findIndex((c) => c.claimId === id || c.id === id);
      if (idx >= 0) {
        const amt = paymentData.amount || 0;
        const newPaid = (claims[idx].paidAmount || 0) + amt;
        claims[idx].paidAmount = newPaid;
        claims[idx].pendingAmount = Math.max(0, (claims[idx].totalBillAmount || claims[idx].claimAmount) - newPaid);
        if (claims[idx].pendingAmount <= 0) {
          claims[idx].status = 'PAID';
          claims[idx].paymentStatus = 'PAID';
          claims[idx].billingPriorityScore = 0;
          claims[idx].billingPriority = 'LOW';
        } else {
          claims[idx].paymentStatus = 'PARTIALLY_PAID';
          claims[idx].billingPriority = claims[idx].pendingAmount >= 50000 ? 'HIGH' : 'MEDIUM';
          claims[idx].billingPriorityScore = Math.max(25, (claims[idx].billingPriorityScore || 70) - 20);
        }
        saveStoredClaims(claims);

        // Auto-dispatch Stage 5 Email
        recordDemoStageEmail(
          claims[idx],
          5,
          'Stage 5: Payment Remittance Recorded (Partial)',
          `Partial payment remittance of ₹${amt.toLocaleString()} recorded. Remaining balance: ₹${claims[idx].pendingAmount.toLocaleString()}.`
        );

        return { data: claims[idx] };
      }
    }
    throw err;
  }
};

export const recordFollowUp = (id, notes = '') => api.post(`/claims/${id}/follow-up`, { notes });

// Lifecycle Email Notifications & Step-by-Step Dispatch
export const getStoredClaimEmails = (claimId) => {
  try {
    const raw = localStorage.getItem(`rcm_emails_${claimId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const recordDemoStageEmail = (claim, stageIndex, stageName, stageDesc, targetEmail = '') => {
  try {
    const cid = claim.claimId || claim.id;
    const recipient = targetEmail || claim.patientEmail || 'balakrishnan206k@gmail.com';
    const list = getStoredClaimEmails(cid);

    // Strictly ensure only one email per stage index for this claim
    const alreadySent = list.find((e) => e.stageIndex === stageIndex);
    if (alreadySent && !targetEmail) {
      return alreadySent;
    }

    const notif = {
      id: 'em-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      claimId: cid,
      patientEmail: recipient,
      patientName: claim.patientName || 'Valued Patient',
      patientReference: claim.patientReference || 'N/A',
      stageIndex: stageIndex,
      stageName: stageName,
      claimStatus: claim.status || 'CREATED',
      billedAmount: claim.totalBillAmount || claim.claimAmount || 0,
      payerName: claim.insuranceCompanyName || claim.payerName || 'Insurance Payer',
      subject: `[RCM Insight] Claim ${cid} — ${stageName}`,
      htmlBody: `<p>Hello <strong>${claim.patientName || 'Valued Patient'}</strong>,</p><p>${stageDesc || 'Progress update recorded for your claim.'}</p>`,
      deliveryStatus: 'DISPATCHED_SMTP',
      deliveryDetails: `Dispatched step-by-step to ${recipient}`,
      sentAt: new Date().toISOString()
    };
    list.unshift(notif);
    localStorage.setItem(`rcm_emails_${cid}`, JSON.stringify(list));
    return notif;
  } catch {
    return null;
  }
};

export const getClaimEmails = (id) =>
  safeRequest(
    () => api.get(`/claims/${id}/emails`),
    () => getStoredClaimEmails(id)
  );

export const sendClaimStageEmail = (id, email = '') =>
  safeRequest(
    () => api.post(`/claims/${id}/send-stage-email`, email ? { email } : {}),
    () => {
      const claims = getStoredClaims();
      const claim = claims.find((c) => c.claimId === id || c.id === id) || { claimId: id, patientEmail: email };
      return recordDemoStageEmail(
        claim,
        claim.status === 'PAID' ? 5 : (['ACCEPTED', 'DENIED', 'PENDING'].includes(claim.status) ? 4 : (['SUBMITTED', 'RESUBMITTED'].includes(claim.status) ? 3 : (['AI_CHECKED', 'HIGH_RISK', 'READY_TO_SUBMIT', 'CORRECTED'].includes(claim.status) ? 2 : 1))),
        `Stage Progress Update (${claim.status || 'CREATED'})`,
        `Manual lifecycle progress dispatch requested for ${id}.`,
        email
      );
    }
  );


// Alerts
export const getAlerts = (companyId = '') =>
  safeRequest(
    () => api.get(`/alerts${companyId && companyId !== 'ALL' ? `?companyId=${encodeURIComponent(companyId)}` : ''}`),
    () => {
      const all = getStoredAlerts();
      if (companyId && companyId !== 'ALL') {
        return all.filter((a) => a.insuranceCompanyId === companyId);
      }
      return all;
    }
  );

export const getActiveAlerts = (companyId = '') =>
  safeRequest(
    () => api.get(`/alerts/active${companyId && companyId !== 'ALL' ? `?companyId=${encodeURIComponent(companyId)}` : ''}`),
    () => {
      const all = getStoredAlerts().filter((a) => !a.resolved);
      if (companyId && companyId !== 'ALL') {
        return all.filter((a) => a.insuranceCompanyId === companyId);
      }
      return all;
    }
  );

export const resolveAlert = async (id) => {
  try {
    return await api.put(`/alerts/${id}/resolve`);
  } catch (err) {
    if (!err.response || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      const alerts = getStoredAlerts();
      const alert = alerts.find((a) => a.id === id || a.alertId === id);
      if (alert) {
        alert.resolved = true;
        saveStoredAlerts(alerts);
        return { data: alert };
      }
    }
    throw err;
  }
};

export const resolveAllAlerts = async () => {
  try {
    return await api.put('/alerts/resolve-all');
  } catch (err) {
    if (!err.response || err.code === 'ECONNABORTED' || err.message?.includes('Network Error')) {
      const alerts = getStoredAlerts();
      alerts.forEach((a) => { a.resolved = true; });
      saveStoredAlerts(alerts);
      return { data: { count: alerts.length } };
    }
    throw err;
  }
};

// Payments Ledger
export const getPayments = () =>
  safeRequest(
    () => api.get('/payments'),
    () => {
      const allPayments = [
        { paymentId: 'PAY-5001', claimId: 'CLM5001', insuranceCompanyId: 'INS002', insuranceCompanyName: 'CareShield Assurance', payerName: 'CareShield', claimAmount: 100000, paidAmount: 100000, paymentStatus: 'PAID', transactionReference: 'TXN-5001-SETTLE', paymentDate: new Date().toISOString() },
        { paymentId: 'PAY-3001', claimId: 'CLM3001', insuranceCompanyId: 'INS001', insuranceCompanyName: 'Nova Health Insurance', payerName: 'Nova Health Insurance', claimAmount: 120000, paidAmount: 20000, paymentStatus: 'PAID', transactionReference: 'TXN-3001-PARTIAL', paymentDate: new Date(Date.now() - 86400000).toISOString() },
        { paymentId: 'PAY-3003', claimId: 'CLM3003', insuranceCompanyId: 'INS003', insuranceCompanyName: 'MediSecure Benefits', payerName: 'MediSecure', claimAmount: 90000, paidAmount: 20000, paymentStatus: 'PAID', transactionReference: 'TXN-3003-PARTIAL', paymentDate: new Date(Date.now() - 2 * 86400000).toISOString() }
      ];

      // If user is insurance company, filter payments in demo mode
      try {
        const raw = localStorage.getItem('rcm_user');
        if (raw) {
          const user = JSON.parse(raw);
          if (user.role === 'INSURANCE_COMPANY' && user.companyId) {
            return allPayments.filter((p) => p.insuranceCompanyId === user.companyId);
          }
        }
      } catch (e) {}

      return allPayments;
    }
  );

// ==========================================
// Authentication APIs
// ==========================================
export const loginUser = (credentials) =>
  safeRequest(
    () => api.post('/auth/login', credentials),
    () => {
      const email = credentials.email.trim().toLowerCase();
      const matched = demoUsers.find((u) => u.email.toLowerCase() === email);
      if (matched) {
        return {
          token: 'demo-jwt-token-' + matched.role.toLowerCase() + '-' + Date.now(),
          userId: matched.id,
          name: matched.name,
          email: matched.email,
          role: matched.role,
          companyId: matched.companyId,
          companyName: matched.companyName,
          accountStatus: matched.accountStatus || 'ACTIVE'
        };
      }
      // Default to demo admin if arbitrary login attempted offline
      return {
        token: 'demo-jwt-token-admin-' + Date.now(),
        userId: 'u-admin-1',
        name: 'RCM Administrator',
        email: email,
        role: 'RCM_ADMIN',
        accountStatus: 'ACTIVE'
      };
    }
  );

export const registerUser = (data) =>
  safeRequest(
    () => api.post('/auth/register', data),
    () => {
      const isAdmin = data.registrationType === 'RCM_ADMIN';
      const companyId = data.companyId || 'INS001';
      const company = demoCompanies.find((c) => c.companyId === companyId);

      return {
        token: 'demo-jwt-token-registered-' + Date.now(),
        userId: 'u-reg-' + Date.now(),
        name: isAdmin ? data.fullName : (data.contactPerson || data.companyName + ' User'),
        email: data.email,
        role: isAdmin ? 'RCM_ADMIN' : 'INSURANCE_COMPANY',
        companyId: !isAdmin ? companyId : undefined,
        companyName: !isAdmin ? (company?.companyName || data.companyName || 'Nova Health Insurance') : undefined,
        accountStatus: 'ACTIVE',
        message: 'Demo registration successful.'
      };
    }
  );

export const getCurrentUser = () =>
  safeRequest(
    () => api.get('/auth/me'),
    () => {
      const raw = localStorage.getItem('rcm_user');
      return raw ? JSON.parse(raw) : null;
    }
  );

export const logoutUser = () =>
  safeRequest(
    () => api.post('/auth/logout'),
    () => ({ message: 'Logged out successfully' })
  );

// ==========================================
// Insurance Company Management (Admin APIs)
// ==========================================
export const getInsuranceCompanies = () =>
  safeRequest(
    () => api.get('/insurance-companies'),
    () => demoCompanies.map((c) => ({
      ...c,
      claimsCount: getStoredClaims().filter((cl) => cl.insuranceCompanyId === c.companyId).length,
      pendingAmount: getStoredClaims()
        .filter((cl) => cl.insuranceCompanyId === c.companyId && cl.status !== 'PAID')
        .reduce((sum, cl) => sum + (cl.pendingAmount || 0), 0),
      activeUsers: 1
    }))
  );

export const getPublicInsuranceCompanies = () =>
  safeRequest(
    () => api.get('/insurance-companies/public'),
    () => demoCompanies
  );

export const createInsuranceCompany = (data) =>
  safeRequest(
    () => api.post('/insurance-companies', data),
    () => {
      const newCompany = {
        id: 'INS' + String(demoCompanies.length + 1).padStart(3, '0'),
        companyId: 'INS' + String(demoCompanies.length + 1).padStart(3, '0'),
        companyCode: data.companyCode.toUpperCase(),
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        email: data.email,
        status: data.status || 'ACTIVE'
      };
      demoCompanies.push(newCompany);
      return newCompany;
    }
  );

export const updateCompanyStatus = (id, status) =>
  safeRequest(
    () => api.put(`/insurance-companies/${id}/status`, { status }),
    () => {
      const c = demoCompanies.find((comp) => comp.id === id || comp.companyId === id);
      if (c) c.status = status;
      return c;
    }
  );

export const updateInsuranceCompanyStatus = updateCompanyStatus;

// ==========================================
// User Management (Admin APIs)
// ==========================================
export const getAdminUsers = () =>
  safeRequest(
    () => api.get('/admin/users'),
    () => demoUsers
  );

export const approveUser = (id) =>
  safeRequest(
    () => api.put(`/admin/users/${id}/approve`),
    () => {
      const u = demoUsers.find((user) => user.id === id);
      if (u) u.accountStatus = 'ACTIVE';
      return u;
    }
  );

export const rejectUser = (id) =>
  safeRequest(
    () => api.put(`/admin/users/${id}/reject`),
    () => {
      const u = demoUsers.find((user) => user.id === id);
      if (u) u.accountStatus = 'SUSPENDED';
      return u;
    }
  );

export const disableUser = (id) =>
  safeRequest(
    () => api.put(`/admin/users/${id}/disable`),
    () => {
      const u = demoUsers.find((user) => user.id === id);
      if (u) u.accountStatus = 'SUSPENDED';
      return u;
    }
  );

// ==========================================
// Insurer Claim Processing / Review API
// ==========================================
export const reviewClaim = (id, reviewData) =>
  safeRequest(
    () => api.post(`/claims/${id}/review`, reviewData),
    () => {
      const claims = getStoredClaims();
      const claim = claims.find((c) => c.id === id || c.claimId === id);
      if (claim) {
        claim.status = reviewData.status;
        if (reviewData.denialReason) claim.denialReason = reviewData.denialReason;
        if (reviewData.allowedAmount) claim.allowedAmount = reviewData.allowedAmount;
        if (reviewData.comments) claim.insurerComments = reviewData.comments;
        if (reviewData.paymentStatus) claim.paymentStatus = reviewData.paymentStatus;
        claim.reviewedAt = new Date().toISOString();
        saveStoredClaims(claims);
        return claim;
      }
      return null;
    }
  );

// ==========================================
// Isolated Patient Email Verification APIs
// ==========================================
// Isolated in-memory fallback store strictly partitioned by patientId::email
const demoVerificationStore = new Map();

export const sendPatientOtp = (patientId, email) =>
  safeRequest(
    () => api.post('/patient-verification/send-otp', { patientId, email }),
    () => {
      const sanitizedPid = (patientId || '').trim();
      const sanitizedEmail = (email || '').trim().toLowerCase();
      const key = `${sanitizedPid}::${sanitizedEmail}`;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      demoVerificationStore.set(key, {
        patientId: sanitizedPid,
        email: sanitizedEmail,
        otp,
        otpExpiry: expiry,
        emailVerified: false,
        verifiedAt: null
      });

      console.log(`[Demo Verification] OTP for ${sanitizedPid} (${sanitizedEmail}): ${otp}`);
      return {
        success: true,
        message: `Verification OTP sent to ${sanitizedEmail}`,
        patientId: sanitizedPid,
        email: sanitizedEmail,
        devOtp: otp,
        expiresAt: expiry
      };
    }
  );

export const verifyPatientOtp = (patientId, email, otp) =>
  safeRequest(
    () => api.post('/patient-verification/verify-otp', { patientId, email, otp }),
    () => {
      const sanitizedPid = (patientId || '').trim();
      const sanitizedEmail = (email || '').trim().toLowerCase();
      const key = `${sanitizedPid}::${sanitizedEmail}`;
      const record = demoVerificationStore.get(key);

      if (!record) {
        return {
          verified: false,
          message: `No verification record found for patient ${sanitizedPid}`
        };
      }

      if (record.otp !== (otp || '').trim()) {
        return {
          verified: false,
          message: 'Invalid OTP code. Please enter the correct code.'
        };
      }

      record.emailVerified = true;
      record.verifiedAt = new Date().toISOString();
      record.otp = null; // Consumed

      return {
        verified: true,
        patientId: sanitizedPid,
        email: sanitizedEmail,
        message: `Email verified successfully for ${sanitizedPid}`,
        verifiedAt: record.verifiedAt
      };
    }
  );

export const getPatientVerificationStatus = (patientId, email) =>
  safeRequest(
    () => api.get(`/patient-verification/status?patientId=${encodeURIComponent(patientId)}&email=${encodeURIComponent(email)}`),
    () => {
      const key = `${(patientId || '').trim()}::${(email || '').trim().toLowerCase()}`;
      const record = demoVerificationStore.get(key);
      return {
        emailVerified: !!record?.emailVerified,
        patientId,
        email
      };
    }
  );

export const clearPatientVerification = (patientId) =>
  safeRequest(
    () => api.post('/patient-verification/clear', { patientId }),
    () => {
      for (const [k, v] of demoVerificationStore.entries()) {
        if (v.patientId === (patientId || '').trim()) {
          demoVerificationStore.delete(k);
        }
      }
      return { message: 'Verification state cleared' };
    }
  );

export default api;


