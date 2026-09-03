// Client-side fallback storage for mobile & offline demos when cloud backend is starting up or disconnected

const STORAGE_KEY_CLAIMS = 'rcm_demo_claims_v1';
const STORAGE_KEY_PAYMENTS = 'rcm_demo_payments_v1';
const STORAGE_KEY_ALERTS = 'rcm_demo_alerts_v1';

export const initialDemoClaims = [
  {
    id: 'c-3001',
    claimId: 'CLM3001',
    patientName: 'Vikramaditya Singhania',
    patientReference: 'PT3001',
    payerName: 'Nova Health Insurance',
    payerType: 'PRIVATE',
    claimAmount: 120000,
    totalBillAmount: 120000,
    paidAmount: 20000,
    pendingAmount: 100000,
    daysPending: 20,
    billingPriorityScore: 93,
    billingPriority: 'CRITICAL',
    priorityReason: 'High-value bill: ₹100,000 pending for 20 days',
    paymentStatus: 'PARTIALLY_PAID',
    status: 'SUBMITTED',
    riskScore: 16,
    riskLevel: 'LOW',
    predictedReason: 'Clean Claim Quality Metrics',
    recommendation: 'Ready for payment follow-up.',
    eligibilityVerified: true,
    authorizationAvailable: true,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 0,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
  },
  {
    id: 'c-3003',
    claimId: 'CLM3003',
    patientName: 'Harishchand Murthy',
    patientReference: 'PT3003',
    payerName: 'MediSecure',
    payerType: 'PRIVATE',
    claimAmount: 90000,
    totalBillAmount: 90000,
    paidAmount: 20000,
    pendingAmount: 70000,
    daysPending: 32,
    billingPriorityScore: 86,
    billingPriority: 'CRITICAL',
    priorityReason: 'Payment overdue (₹70,000) for more than 30 days (32 days total)',
    paymentStatus: 'PARTIALLY_PAID',
    status: 'PENDING',
    riskScore: 24,
    riskLevel: 'LOW',
    predictedReason: 'Clean Claim Quality Metrics',
    recommendation: 'High-value balance overdue > 30 days.',
    eligibilityVerified: true,
    authorizationAvailable: true,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 1,
    createdAt: new Date(Date.now() - 32 * 86400000).toISOString()
  },
  {
    id: 'c-2060',
    claimId: 'CLM2060',
    patientName: 'Rohan Malhotra',
    patientReference: 'PT2060',
    payerName: 'HealthPrime',
    payerType: 'COMMERCIAL',
    claimAmount: 85000,
    totalBillAmount: 85000,
    paidAmount: 0,
    pendingAmount: 85000,
    daysPending: 18,
    billingPriorityScore: 79,
    billingPriority: 'HIGH',
    priorityReason: '₹85,000 pending for 18 days from HealthPrime',
    paymentStatus: 'UNPAID',
    status: 'SUBMITTED',
    riskScore: 21,
    riskLevel: 'LOW',
    predictedReason: 'Clean Claim Quality Metrics',
    recommendation: 'Awaiting initial remittance.',
    eligibilityVerified: true,
    authorizationAvailable: true,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 0,
    createdAt: new Date(Date.now() - 18 * 86400000).toISOString()
  },
  {
    id: 'c-3002',
    claimId: 'CLM3002',
    patientName: 'Ananya Deshmukh',
    patientReference: 'PT3002',
    payerName: 'CareShield',
    payerType: 'COMMERCIAL',
    claimAmount: 25000,
    totalBillAmount: 25000,
    paidAmount: 0,
    pendingAmount: 25000,
    daysPending: 12,
    billingPriorityScore: 43,
    billingPriority: 'MEDIUM',
    priorityReason: '₹25,000 pending for 12 days from CareShield',
    paymentStatus: 'UNPAID',
    status: 'PENDING',
    riskScore: 19,
    riskLevel: 'LOW',
    predictedReason: 'Clean Claim Quality Metrics',
    recommendation: 'Under standard payer adjudication.',
    eligibilityVerified: true,
    authorizationAvailable: true,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 0,
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString()
  },
  {
    id: 'c-5001',
    claimId: 'CLM5001',
    patientName: 'Suresh Nambiar',
    patientReference: 'PT5001',
    payerName: 'CareShield',
    payerType: 'COMMERCIAL',
    claimAmount: 100000,
    totalBillAmount: 100000,
    paidAmount: 100000,
    pendingAmount: 0,
    daysPending: 1,
    billingPriorityScore: 0,
    billingPriority: 'LOW',
    priorityReason: 'Full bill amount settled',
    paymentStatus: 'PAID',
    status: 'PAID',
    riskScore: 18,
    riskLevel: 'LOW',
    predictedReason: 'Clean Claim Quality Metrics',
    recommendation: 'Fully paid and settled.',
    eligibilityVerified: true,
    authorizationAvailable: true,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 0,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
  },
  {
    id: 'c-1001',
    claimId: 'CLM1001',
    patientName: 'Arun Kumar',
    patientReference: 'PT1001',
    payerName: 'Nova Health Insurance',
    payerType: 'PRIVATE',
    claimAmount: 35000,
    totalBillAmount: 35000,
    paidAmount: 0,
    pendingAmount: 35000,
    daysPending: 14,
    billingPriorityScore: 57,
    billingPriority: 'HIGH',
    priorityReason: '₹35,000 pending for 14 days from Nova Health Insurance',
    paymentStatus: 'UNPAID',
    status: 'DENIED',
    riskScore: 84,
    riskLevel: 'HIGH',
    predictedReason: 'Insurance Eligibility Not Verified',
    recommendation: 'Verify active insurance coverage before resubmission.',
    denialReason: 'Eligibility Issue: Coverage expired on 2026-08-15',
    eligibilityVerified: false,
    authorizationAvailable: true,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 2,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
  },
  {
    id: 'c-1002',
    claimId: 'CLM1002',
    patientName: 'Priya Sharma',
    patientReference: 'PT1002',
    payerName: 'CareShield',
    payerType: 'COMMERCIAL',
    claimAmount: 48000,
    totalBillAmount: 48000,
    paidAmount: 0,
    pendingAmount: 48000,
    daysPending: 8,
    billingPriorityScore: 57,
    billingPriority: 'HIGH',
    priorityReason: '₹48,000 pending for 8 days from CareShield',
    paymentStatus: 'UNPAID',
    status: 'HIGH_RISK',
    riskScore: 88,
    riskLevel: 'HIGH',
    predictedReason: 'Missing Prior Authorization',
    recommendation: 'Obtain required pre-authorization from CareShield.',
    eligibilityVerified: true,
    authorizationAvailable: false,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 3,
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
  }
];

export const initialDemoAlerts = [
  {
    id: 'alt-1',
    alertId: 'ALT-3001',
    claimId: 'CLM3001',
    type: 'HIGH_PRIORITY',
    severity: 'CRITICAL',
    title: 'High Outstanding Bill: CLM3001',
    message: '₹100,000 outstanding for 20 days on claim CLM3001 with Nova Health Insurance. Immediate follow-up recommended.',
    resolved: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 'alt-2',
    alertId: 'ALT-3003',
    claimId: 'CLM3003',
    type: 'OVERDUE',
    severity: 'CRITICAL',
    title: 'Overdue Payment: CLM3003',
    message: '₹70,000 pending for 32 days with MediSecure. Exceeds standard 30-day settlement window.',
    resolved: false,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: 'alt-3',
    alertId: 'ALT-1001',
    claimId: 'CLM1001',
    type: 'DENIAL',
    severity: 'CRITICAL',
    title: 'Claim Denied: CLM1001',
    message: 'Claim CLM1001 was denied by Nova Health Insurance due to: Eligibility Issue (Coverage expired).',
    resolved: false,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString()
  },
  {
    id: 'alt-4',
    alertId: 'ALT-5001',
    claimId: 'CLM5001',
    type: 'PAYMENT',
    severity: 'SUCCESS',
    title: 'Payment Settled: CLM5001',
    message: 'Full settlement of ₹100,000 received for CLM5001 from CareShield.',
    resolved: true,
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString()
  }
];

// Helper functions for localStorage fallback
export function getStoredClaims() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLAIMS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(initialDemoClaims));
  return initialDemoClaims;
}

export function saveStoredClaims(claims) {
  try {
    localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(claims));
  } catch (e) {}
}

export function getStoredAlerts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALERTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(initialDemoAlerts));
  return initialDemoAlerts;
}

export function saveStoredAlerts(alerts) {
  try {
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
  } catch (e) {}
}

export function calculateDemoMetrics(claims) {
  const totalClaims = claims.length;
  const acceptedClaims = claims.filter((c) => c.status === 'ACCEPTED' || c.status === 'PAID').length;
  const deniedClaims = claims.filter((c) => c.status === 'DENIED').length;
  const pendingClaims = claims.filter((c) => ['PENDING', 'SUBMITTED', 'RESUBMITTED'].includes(c.status)).length;
  const paidClaims = claims.filter((c) => c.paymentStatus === 'PAID').length;
  const highRiskClaims = claims.filter((c) => c.riskLevel === 'HIGH').length;
  const mediumRiskClaims = claims.filter((c) => c.riskLevel === 'MEDIUM').length;
  const lowRiskClaims = claims.filter((c) => c.riskLevel === 'LOW').length;

  const totalOutstanding = claims
    .filter((c) => c.paymentStatus !== 'PAID' && c.pendingAmount > 0)
    .reduce((acc, c) => acc + (c.pendingAmount || 0), 0);

  const highPriorityOutstanding = claims
    .filter((c) => c.paymentStatus !== 'PAID' && ['CRITICAL', 'HIGH'].includes(c.billingPriority))
    .reduce((acc, c) => acc + (c.pendingAmount || 0), 0);

  const revenueReceived = claims.reduce((acc, c) => acc + (c.paidAmount || 0), 0);
  const totalClaimAmount = claims.reduce((acc, c) => acc + (c.totalBillAmount || c.claimAmount || 0), 0);

  const acceptanceRate = totalClaims > 0 ? Math.round((acceptedClaims / totalClaims) * 1000) / 10 : 0;
  const denialRate = totalClaims > 0 ? Math.round((deniedClaims / totalClaims) * 1000) / 10 : 0;

  return {
    totalClaims,
    acceptedClaims,
    deniedClaims,
    pendingClaims,
    paidClaims,
    highRiskClaims,
    mediumRiskClaims,
    lowRiskClaims,
    totalOutstanding,
    highPriorityOutstanding,
    revenueReceived,
    totalClaimAmount,
    acceptanceRate,
    denialRate,
    priorityQueueCount: claims.filter((c) => c.paymentStatus !== 'PAID' && c.pendingAmount > 0).length,
    statusBreakdown: {
      SUBMITTED: claims.filter((c) => c.status === 'SUBMITTED').length,
      PENDING: claims.filter((c) => c.status === 'PENDING').length,
      DENIED: deniedClaims,
      PAID: paidClaims,
      HIGH_RISK: highRiskClaims,
      CREATED: claims.filter((c) => c.status === 'CREATED').length
    }
  };
}
