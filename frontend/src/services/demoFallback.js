// Client-side fallback storage for mobile & offline demos when cloud backend is starting up or disconnected

const STORAGE_KEY_CLAIMS = 'rcm_demo_claims_v1';
const STORAGE_KEY_PAYMENTS = 'rcm_demo_payments_v1';
const STORAGE_KEY_ALERTS = 'rcm_demo_alerts_v1';

export const initialDemoClaims = [
  {
    id: 'c-6004',
    claimId: 'CLM6004',
    patientName: 'Rajeshwari Natarajan',
    patientReference: 'PT6004',
    payerName: 'HealthPrime',
    payerType: 'COMMERCIAL',
    claimAmount: 150000,
    totalBillAmount: 150000,
    paidAmount: 30000,
    pendingAmount: 120000,
    daysPending: 110,
    agingBucket: '90+',
    agingStatus: 'CRITICAL',
    billingPriorityScore: 98,
    billingPriority: 'CRITICAL',
    priorityReason: 'Critical overdue: 110 days pending. Payer liaison contact required.',
    paymentStatus: 'PARTIALLY_PAID',
    status: 'PENDING',
    riskScore: 26,
    riskLevel: 'LOW',
    predictedReason: 'Clean Claim Quality Metrics',
    recommendation: 'Escalate to HealthPrime liaison.',
    eligibilityVerified: true,
    authorizationAvailable: true,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 2,
    followUpStatus: 'WAITING_FOR_PAYER',
    followUpNotes: 'Called HealthPrime claims liaison. Payer requested updated itemized surgical ledger.',
    createdAt: new Date(Date.now() - 110 * 86400000).toISOString()
  },
  {
    id: 'c-6003',
    claimId: 'CLM6003',
    patientName: 'Meera Krishnan',
    patientReference: 'PT6003',
    payerName: 'MediSecure',
    payerType: 'PRIVATE',
    claimAmount: 120000,
    totalBillAmount: 120000,
    paidAmount: 20000,
    pendingAmount: 100000,
    daysPending: 75,
    agingBucket: '61-90',
    agingStatus: 'HIGH_ATTENTION',
    billingPriorityScore: 93,
    billingPriority: 'CRITICAL',
    priorityReason: 'High-value balance overdue > 60 days. Escalation warning sent.',
    paymentStatus: 'PARTIALLY_PAID',
    status: 'PENDING',
    riskScore: 22,
    riskLevel: 'LOW',
    predictedReason: 'Clean Claim Quality Metrics',
    recommendation: 'Second notice issued to MediSecure.',
    eligibilityVerified: true,
    authorizationAvailable: true,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 1,
    followUpStatus: 'CONTACTED',
    followUpNotes: 'Follow-up email sent to MediSecure adjudicator.',
    createdAt: new Date(Date.now() - 75 * 86400000).toISOString()
  },
  {
    id: 'c-6002',
    claimId: 'CLM6002',
    patientName: 'Siddharth Venkat',
    patientReference: 'PT6002',
    payerName: 'CareShield',
    payerType: 'COMMERCIAL',
    claimAmount: 90000,
    totalBillAmount: 90000,
    paidAmount: 10000,
    pendingAmount: 80000,
    daysPending: 45,
    agingBucket: '31-60',
    agingStatus: 'FOLLOW_UP',
    billingPriorityScore: 78,
    billingPriority: 'HIGH',
    priorityReason: 'First follow-up call placed to CareShield.',
    paymentStatus: 'PARTIALLY_PAID',
    status: 'PENDING',
    riskScore: 18,
    riskLevel: 'LOW',
    predictedReason: 'Clean Claim Quality Metrics',
    recommendation: 'Pending payer review.',
    eligibilityVerified: true,
    authorizationAvailable: true,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 0,
    followUpStatus: 'NOT_STARTED',
    followUpNotes: '',
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString()
  },
  {
    id: 'c-6001',
    claimId: 'CLM6001',
    patientName: 'Kavita Ramachandran',
    patientReference: 'PT6001',
    payerName: 'Nova Health Insurance',
    payerType: 'PRIVATE',
    claimAmount: 100000,
    totalBillAmount: 100000,
    paidAmount: 20000,
    pendingAmount: 80000,
    daysPending: 20,
    agingBucket: '0-30',
    agingStatus: 'MONITOR',
    billingPriorityScore: 73,
    billingPriority: 'HIGH',
    priorityReason: 'Within standard 30-day payment cycle.',
    paymentStatus: 'PARTIALLY_PAID',
    status: 'SUBMITTED',
    riskScore: 15,
    riskLevel: 'LOW',
    predictedReason: 'Clean Claim Quality Metrics',
    recommendation: 'Standard monitoring.',
    eligibilityVerified: true,
    authorizationAvailable: true,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 0,
    followUpStatus: 'NOT_STARTED',
    followUpNotes: '',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
  },
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
    payerName: 'CareShield Assurance',
    payerType: 'COMMERCIAL',
    insuranceCompanyId: 'INS002',
    insuranceCompanyName: 'CareShield Assurance',
    claimAmount: 48000,
    totalBillAmount: 48000,
    paidAmount: 0,
    pendingAmount: 48000,
    daysPending: 8,
    billingPriorityScore: 57,
    billingPriority: 'HIGH',
    priorityReason: '₹48,000 pending for 8 days from CareShield Assurance',
    paymentStatus: 'UNPAID',
    status: 'DENIED',
    riskScore: 88,
    riskLevel: 'HIGH',
    predictedReason: 'Missing Prior Authorization',
    recommendation: 'Obtain required pre-authorization from CareShield.',
    denialReason: 'Prior Authorization Absent: Pre-auth required for surgical procedure code 99214',
    eligibilityVerified: true,
    authorizationAvailable: false,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 3,
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
  },
  {
    id: 'c-1003',
    claimId: 'CLM1003',
    patientName: 'Rahul Verma',
    patientReference: 'PT1003',
    payerName: 'MediSecure Benefits',
    payerType: 'PRIVATE',
    insuranceCompanyId: 'INS003',
    insuranceCompanyName: 'MediSecure Benefits',
    claimAmount: 62000,
    totalBillAmount: 62000,
    paidAmount: 0,
    pendingAmount: 62000,
    daysPending: 22,
    billingPriorityScore: 76,
    billingPriority: 'HIGH',
    priorityReason: 'Claim denied: Incomplete / Invalid Coding',
    paymentStatus: 'UNPAID',
    status: 'DENIED',
    riskScore: 76,
    riskLevel: 'HIGH',
    predictedReason: 'Incomplete / Invalid Coding (ICD/CPT)',
    recommendation: 'Review diagnosis coding.',
    denialReason: 'Coding Error: CPT 99214 requires modifier -25',
    eligibilityVerified: true,
    authorizationAvailable: true,
    codingComplete: false,
    documentationComplete: false,
    previousDenials: 1,
    createdAt: new Date(Date.now() - 22 * 86400000).toISOString()
  },
  {
    id: 'c-4004',
    claimId: 'CLM4004',
    patientName: 'Manish Tiwari',
    patientReference: 'PT4004',
    payerName: 'HealthPrime Plan',
    payerType: 'COMMERCIAL',
    insuranceCompanyId: 'INS004',
    insuranceCompanyName: 'HealthPrime Plan',
    claimAmount: 68000,
    totalBillAmount: 68000,
    paidAmount: 0,
    pendingAmount: 68000,
    daysPending: 16,
    billingPriorityScore: 82,
    billingPriority: 'HIGH',
    priorityReason: 'Timely Filing Window Exceeded on HealthPrime claim',
    paymentStatus: 'UNPAID',
    status: 'DENIED',
    riskScore: 82,
    riskLevel: 'HIGH',
    predictedReason: 'Timely Filing Window Exceeded',
    recommendation: 'File formal appeal within 30 days.',
    denialReason: 'Filing Limit Exceeded: Claim submitted past 90-day payer adjudication window.',
    eligibilityVerified: true,
    authorizationAvailable: false,
    codingComplete: true,
    documentationComplete: true,
    previousDenials: 2,
    createdAt: new Date(Date.now() - 16 * 86400000).toISOString()
  },
  {
    id: 'c-4005',
    claimId: 'CLM4005',
    patientName: 'Tanvi Agarwal',
    patientReference: 'PT4005',
    payerName: 'Unity Payer Network',
    payerType: 'PRIVATE',
    insuranceCompanyId: 'INS005',
    insuranceCompanyName: 'Unity Payer Network',
    claimAmount: 52000,
    totalBillAmount: 52000,
    paidAmount: 0,
    pendingAmount: 52000,
    daysPending: 19,
    billingPriorityScore: 79,
    billingPriority: 'HIGH',
    priorityReason: 'Incomplete documentation: operative notes unverified',
    paymentStatus: 'UNPAID',
    status: 'DENIED',
    riskScore: 79,
    riskLevel: 'HIGH',
    predictedReason: 'Incomplete Clinical Documentation',
    recommendation: 'Submit operative notes and pathology report.',
    denialReason: 'Documentation Deficient: Operative notes missing required physician signature.',
    eligibilityVerified: true,
    authorizationAvailable: true,
    codingComplete: false,
    documentationComplete: false,
    previousDenials: 1,
    createdAt: new Date(Date.now() - 19 * 86400000).toISOString()
  }
];

export const initialDemoAlerts = [
  {
    id: 'alt-1',
    alertId: 'ALT-NOVA-101',
    claimId: 'CLM1001',
    insuranceCompanyId: 'INS001',
    insuranceCompanyName: 'Nova Health Insurance',
    type: 'DENIAL',
    severity: 'CRITICAL',
    title: 'Eligibility Lapsed: CLM1001',
    message: 'Claim CLM1001 has expired policy coverage. Immediate member verification needed.',
    resolved: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString()
  },
  {
    id: 'alt-2',
    alertId: 'ALT-NOVA-102',
    claimId: 'CLM3001',
    insuranceCompanyId: 'INS001',
    insuranceCompanyName: 'Nova Health Insurance',
    type: 'HIGH_PRIORITY',
    severity: 'WARNING',
    title: 'High Outstanding Bill: CLM3001',
    message: '₹100,000 pending for 20 days on inpatient claim CLM3001 with Nova Health Insurance.',
    resolved: false,
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString()
  },
  {
    id: 'alt-3',
    alertId: 'ALT-CARE-201',
    claimId: 'CLM1002',
    insuranceCompanyId: 'INS002',
    insuranceCompanyName: 'CareShield Assurance',
    type: 'HIGH_RISK',
    severity: 'CRITICAL',
    title: 'Prior Authorization Absent: CLM1002',
    message: 'AI Risk engine detected missing pre-authorization documentation for high-cost surgery (₹48,000).',
    resolved: false,
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString()
  },
  {
    id: 'alt-4',
    alertId: 'ALT-CARE-202',
    claimId: 'CLM5001',
    insuranceCompanyId: 'INS002',
    insuranceCompanyName: 'CareShield Assurance',
    type: 'PAYMENT',
    severity: 'SUCCESS',
    title: 'Payment Settled: CLM5001',
    message: 'Full settlement of ₹100,000 received for CLM5001 from CareShield.',
    resolved: true,
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString()
  },
  {
    id: 'alt-5',
    alertId: 'ALT-MEDI-301',
    claimId: 'CLM1003',
    insuranceCompanyId: 'INS003',
    insuranceCompanyName: 'MediSecure Benefits',
    type: 'DENIAL',
    severity: 'CRITICAL',
    title: 'Invalid Coding / CPT Modifier: CLM1003',
    message: 'Claim denied due to missing modifier -25 on consultation CPT 99214. Resubmission required.',
    resolved: false,
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString()
  },
  {
    id: 'alt-6',
    alertId: 'ALT-MEDI-302',
    claimId: 'CLM3003',
    insuranceCompanyId: 'INS003',
    insuranceCompanyName: 'MediSecure Benefits',
    type: 'OVERDUE',
    severity: 'CRITICAL',
    title: 'A/R Overdue Threshold Exceeded: CLM3003',
    message: '₹70,000 pending for 32 days with MediSecure Benefits. Exceeds standard 30-day settlement window.',
    resolved: false,
    createdAt: new Date(Date.now() - 7 * 3600000).toISOString()
  },
  {
    id: 'alt-7',
    alertId: 'ALT-HP-401',
    claimId: 'CLM2060',
    insuranceCompanyId: 'INS004',
    insuranceCompanyName: 'HealthPrime Plan',
    type: 'PAYMENT',
    severity: 'WARNING',
    title: 'Initial Remittance Advice Pending: CLM2060',
    message: '₹85,000 submitted claim CLM2060 awaiting initial electronic remittance confirmation.',
    resolved: false,
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString()
  },
  {
    id: 'alt-8',
    alertId: 'ALT-UNITY-501',
    claimId: 'CLM2065',
    insuranceCompanyId: 'INS005',
    insuranceCompanyName: 'Unity Payer Network',
    type: 'PAYMENT',
    severity: 'INFO',
    title: 'Partial Remittance Applied: CLM2065',
    message: 'Partial payment of ₹15,000 recorded. ₹45,000 remains pending with Unity Payer Network.',
    resolved: false,
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString()
  }
];

// Demo Insurance Companies
export const demoCompanies = [
  { id: 'INS001', companyId: 'INS001', companyCode: 'NOVA001', companyName: 'Nova Health Insurance', contactPerson: 'John Miller', email: 'nova@insurance.com', status: 'ACTIVE' },
  { id: 'INS002', companyId: 'INS002', companyCode: 'CARE002', companyName: 'CareShield Assurance', contactPerson: 'Sarah Jenkins', email: 'careshield@insurance.com', status: 'ACTIVE' },
  { id: 'INS003', companyId: 'INS003', companyCode: 'MEDI003', companyName: 'MediSecure Benefits', contactPerson: 'Robert Vance', email: 'medisecure@insurance.com', status: 'ACTIVE' },
  { id: 'INS004', companyId: 'INS004', companyCode: 'HP004', companyName: 'HealthPrime Plan', contactPerson: 'Priya Patel', email: 'healthprime@insurance.com', status: 'ACTIVE' },
  { id: 'INS005', companyId: 'INS005', companyCode: 'UNITY005', companyName: 'Unity Payer Network', contactPerson: 'David Chen', email: 'unity@insurance.com', status: 'ACTIVE' }
];

export const demoUsers = [
  { id: 'u-admin-1', email: 'admin@rcminsight.demo', name: 'RCM Administrator', role: 'RCM_ADMIN', organizationName: 'National Revenue Cycle Management', accountStatus: 'ACTIVE' },
  { id: 'u-admin-2', email: 'admin@rcminsight.com', name: 'RCM Administrator', role: 'RCM_ADMIN', organizationName: 'National Revenue Cycle Management', accountStatus: 'ACTIVE' },
  { id: 'u-nova-1', email: 'nova@rcminsight.demo', name: 'Nova Insurance User', role: 'INSURANCE_COMPANY', companyId: 'INS001', companyName: 'Nova Health Insurance', accountStatus: 'ACTIVE' },
  { id: 'u-nova-2', email: 'nova@insurance.com', name: 'John Miller', role: 'INSURANCE_COMPANY', companyId: 'INS001', companyName: 'Nova Health Insurance', accountStatus: 'ACTIVE' },
  { id: 'u-care-1', email: 'careshield@rcminsight.demo', name: 'CareShield Adjudicator', role: 'INSURANCE_COMPANY', companyId: 'INS002', companyName: 'CareShield Assurance', accountStatus: 'ACTIVE' },
  { id: 'u-medi-1', email: 'medisecure@rcminsight.demo', name: 'MediSecure Specialist', role: 'INSURANCE_COMPANY', companyId: 'INS003', companyName: 'MediSecure Benefits', accountStatus: 'ACTIVE' },
  { id: 'u-prime-1', email: 'healthprime@rcminsight.demo', name: 'HealthPrime Reviewer', role: 'INSURANCE_COMPANY', companyId: 'INS004', companyName: 'HealthPrime Plan', accountStatus: 'ACTIVE' },
  { id: 'u-unity-1', email: 'unity@rcminsight.demo', name: 'Unity Network Reviewer', role: 'INSURANCE_COMPANY', companyId: 'INS005', companyName: 'Unity Payer Network', accountStatus: 'ACTIVE' }
];

// Helper functions for localStorage fallback
export function getStoredClaims() {
  let claims;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLAIMS);
    claims = raw ? JSON.parse(raw) : [...initialDemoClaims];
  } catch (e) {
    claims = [...initialDemoClaims];
  }

  // Ensure all initial demo claims (including CLM4004 & CLM4005 denied claims) exist
  const existingIds = new Set(claims.map((c) => c.claimId));
  for (const initClaim of initialDemoClaims) {
    if (!existingIds.has(initClaim.claimId)) {
      claims.push({ ...initClaim });
      existingIds.add(initClaim.claimId);
    }
  }

  // Ensure insuranceCompanyId is populated on every claim
  claims = claims.map((c) => {
    const payer = ((c.payerName || '') + ' ' + (c.insuranceCompanyName || '')).toLowerCase();
    if (payer.includes('nova')) { c.insuranceCompanyId = 'INS001'; c.insuranceCompanyName = 'Nova Health Insurance'; c.payerName = 'Nova Health Insurance'; }
    else if (payer.includes('care') || payer.includes('shield')) { c.insuranceCompanyId = 'INS002'; c.insuranceCompanyName = 'CareShield Assurance'; c.payerName = 'CareShield Assurance'; }
    else if (payer.includes('medi') || payer.includes('secure')) { c.insuranceCompanyId = 'INS003'; c.insuranceCompanyName = 'MediSecure Benefits'; c.payerName = 'MediSecure Benefits'; }
    else if (payer.includes('prime') || payer.includes('healthprime')) { c.insuranceCompanyId = 'INS004'; c.insuranceCompanyName = 'HealthPrime Plan'; c.payerName = 'HealthPrime Plan'; }
    else if (payer.includes('unity')) { c.insuranceCompanyId = 'INS005'; c.insuranceCompanyName = 'Unity Payer Network'; c.payerName = 'Unity Payer Network'; }
    else { c.insuranceCompanyId = 'INS001'; c.insuranceCompanyName = 'Nova Health Insurance'; c.payerName = 'Nova Health Insurance'; }
    return c;
  });

  // Strict backend-like data isolation for insurance companies
  try {
    const rawUser = localStorage.getItem('rcm_user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user.role === 'INSURANCE_COMPANY' && user.companyId) {
        return claims.filter((c) => c.insuranceCompanyId === user.companyId);
      }
    }
  } catch (e) {}

  return claims;
}

export function getAllStoredClaims() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLAIMS);
    return raw ? JSON.parse(raw) : [...initialDemoClaims];
  } catch (e) {
    return [...initialDemoClaims];
  }
}

export function saveStoredClaims(claims) {
  try {
    localStorage.setItem(STORAGE_KEY_CLAIMS, JSON.stringify(claims));
  } catch (e) {}
}

export function getStoredAlerts() {
  let alerts;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALERTS);
    alerts = raw ? JSON.parse(raw) : [...initialDemoAlerts];
  } catch (e) {
    alerts = [...initialDemoAlerts];
  }

  // Ensure insuranceCompanyId is set on every alert
  alerts = alerts.map((a) => {
    if (!a.insuranceCompanyId) {
      const text = ((a.title || '') + ' ' + (a.message || '')).toLowerCase();
      if (text.includes('care') || text.includes('shield')) { a.insuranceCompanyId = 'INS002'; a.insuranceCompanyName = 'CareShield Assurance'; }
      else if (text.includes('medi') || text.includes('secure')) { a.insuranceCompanyId = 'INS003'; a.insuranceCompanyName = 'MediSecure Benefits'; }
      else if (text.includes('prime')) { a.insuranceCompanyId = 'INS004'; a.insuranceCompanyName = 'HealthPrime Plan'; }
      else if (text.includes('unity')) { a.insuranceCompanyId = 'INS005'; a.insuranceCompanyName = 'Unity Payer Network'; }
      else { a.insuranceCompanyId = 'INS001'; a.insuranceCompanyName = 'Nova Health Insurance'; }
    }
    return a;
  });

  // Strict isolation for Insurance Company in local storage mode
  try {
    const rawUser = localStorage.getItem('rcm_user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      if (user.role === 'INSURANCE_COMPANY' && user.companyId) {
        return alerts.filter((a) => a.insuranceCompanyId === user.companyId);
      }
    }
  } catch (e) {}

  return alerts;
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

export function getDemoClaimDateString(c) {
  const dateStr = c.claimSubmittedDate || c.createdAt;
  if (dateStr) {
    return dateStr.split('T')[0];
  }
  const days = c.daysPending || 1;
  return new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
}

export function calculateDemoArAgingSummary(claims, payer = '', date = '') {
  let activeClaims = claims.filter(
    (c) => c.paymentStatus !== 'PAID' && (c.pendingAmount > 0 || !c.agingBucket?.includes('CLOSED'))
  );

  if (payer && payer !== 'ALL') {
    activeClaims = activeClaims.filter(
      (c) => c.payerName?.toLowerCase() === payer.toLowerCase()
    );
  }

  if (date && date !== 'ALL') {
    activeClaims = activeClaims.filter(
      (c) => getDemoClaimDateString(c) === date
    );
  }

  const totalOutstanding = activeClaims.reduce((acc, c) => acc + (c.pendingAmount || 0), 0);
  const totalPendingClaims = activeClaims.length;

  const avgDays =
    totalPendingClaims > 0
      ? Math.round(activeClaims.reduce((acc, c) => acc + (c.daysPending || 1), 0) / totalPendingClaims)
      : 0;

  const oldestDays =
    totalPendingClaims > 0
      ? Math.max(...activeClaims.map((c) => c.daysPending || 1))
      : 0;

  const b0_30 = activeClaims.filter((c) => (c.daysPending || 1) <= 30);
  const b31_60 = activeClaims.filter((c) => (c.daysPending || 1) >= 31 && (c.daysPending || 1) <= 60);
  const b61_90 = activeClaims.filter((c) => (c.daysPending || 1) >= 61 && (c.daysPending || 1) <= 90);
  const b90_plus = activeClaims.filter((c) => (c.daysPending || 1) > 90);

  return {
    totalOutstanding,
    totalPendingClaims,
    averageDaysOutstanding: avgDays,
    oldestPendingDays: oldestDays,
    buckets: {
      '0-30': {
        claimCount: b0_30.length,
        amount: b0_30.reduce((acc, c) => acc + (c.pendingAmount || 0), 0),
        status: 'MONITOR'
      },
      '31-60': {
        claimCount: b31_60.length,
        amount: b31_60.reduce((acc, c) => acc + (c.pendingAmount || 0), 0),
        status: 'FOLLOW_UP'
      },
      '61-90': {
        claimCount: b61_90.length,
        amount: b61_90.reduce((acc, c) => acc + (c.pendingAmount || 0), 0),
        status: 'HIGH_ATTENTION'
      },
      '90+': {
        claimCount: b90_plus.length,
        amount: b90_plus.reduce((acc, c) => acc + (c.pendingAmount || 0), 0),
        status: 'CRITICAL'
      }
    }
  };
}

export function getDemoArAgingClaims(claims, bucket = '', payer = '', date = '') {
  let active = claims.filter(
    (c) => c.paymentStatus !== 'PAID' && (c.pendingAmount > 0 || !c.agingBucket?.includes('CLOSED'))
  );

  if (payer && payer !== 'ALL') {
    active = active.filter(
      (c) => c.payerName?.toLowerCase() === payer.toLowerCase()
    );
  }

  if (date && date !== 'ALL') {
    active = active.filter(
      (c) => getDemoClaimDateString(c) === date
    );
  }

  if (bucket && bucket !== 'ALL') {
    active = active.filter((c) => {
      const days = c.daysPending || 1;
      if (bucket === '0-30') return days <= 30;
      if (bucket === '31-60') return days >= 31 && days <= 60;
      if (bucket === '61-90') return days >= 61 && days <= 90;
      if (bucket === '90+') return days > 90;
      return true;
    });
  }

  return active.sort((a, b) => {
    const daysDiff = (b.daysPending || 1) - (a.daysPending || 1);
    if (daysDiff !== 0) return daysDiff;
    return (b.pendingAmount || 0) - (a.pendingAmount || 0);
  });
}

export function getDemoDailyStats(claims, payer = '') {
  let active = claims.filter(
    (c) => c.paymentStatus !== 'PAID' && (c.pendingAmount > 0 || !c.agingBucket?.includes('CLOSED'))
  );

  if (payer && payer !== 'ALL') {
    active = active.filter(
      (c) => c.payerName?.toLowerCase() === payer.toLowerCase()
    );
  }

  const byDate = {};
  for (const c of active) {
    const dateStr = getDemoClaimDateString(c);
    if (!byDate[dateStr]) byDate[dateStr] = [];
    byDate[dateStr].push(c);
  }

  const result = [];
  for (const [dateStr, dayClaims] of Object.entries(byDate)) {
    const totalClaimAmount = dayClaims.reduce((acc, c) => acc + (c.totalBillAmount || c.claimAmount || 0), 0);
    const totalPaidAmount = dayClaims.reduce((acc, c) => acc + (c.paidAmount || 0), 0);
    const totalPendingAmount = dayClaims.reduce((acc, c) => acc + (c.pendingAmount || 0), 0);
    const avgDays = Math.round(dayClaims.reduce((acc, c) => acc + (c.daysPending || 1), 0) / dayClaims.length);

    let formattedDisplay = dateStr;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        formattedDisplay = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    } catch (e) {}

    result.push({
      date: dateStr,
      formattedDate: formattedDisplay,
      daysPending: avgDays,
      claimCount: dayClaims.length,
      totalClaimAmount,
      totalPaidAmount,
      totalPendingAmount
    });
  }

  return result.sort((a, b) => b.date.localeCompare(a.date));
}

