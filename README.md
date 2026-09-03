# RCM INSIGHT
### AI-Powered Real-Time Revenue Cycle Command Center & Smart Billing Priority Queue
> **"Predict • Prevent • Monitor • Improve"**  
> Developed for Healthcare Hackathon by **Team XIRO TECH**

---

## 1. Executive Summary & Problem Statement

Healthcare billing teams manage millions in claims spread across disparate electronic health records (EHRs), payer portals, spreadsheets, and delayed 835/837 EDI reports. Traditional revenue cycle management is **reactive** — hospitals only discover claim rejections weeks after submission when an explanation of benefits (EOB) denial arrives, and billing staff struggle to manually identify which unpaid claims to follow up on first.

**RCM Insight** solves both challenges with two integrated layers:
1. **Pre-Submission AI Intelligence Layer**: Audits claims *before* payer submission using Random Forest Machine Learning + Rule-Based Explainability to eliminate avoidable denials (unverified eligibility, missing prior authorization, invalid ICD/CPT coding, incomplete clinical documentation).
2. **Smart Billing Priority Queue (Bill-Amount Driven)**: Automatically ranks unpaid and partially paid hospital bills by financial urgency (**Pending Bill Amount [70%]** + **Pending Duration [30%]**), placing high-value and long-pending balances at the top for follow-up.

---

## 2. High-Level Architecture

```
                                  ┌────────────────────────┐
                                  │   Billing Specialist   │
                                  │     / RCM Manager      │
                                  └───────────┬────────────┘
                                              │
                                              ▼
                                 ┌──────────────────────────┐
                                 │   React.js Dashboard     │
                                 │  • Smart Priority Queue  │
                                 │  • AI Denial Risk Meter  │
                                 │  • Recharts & KPIs       │
                                 │       Port: 5173         │
                                 └──────▲────────────┬──────┘
                                        │            │
                           REST API /   │            │ Live Polling /
                           Submissions  │            │ WebSocket Sync
                                        ▼            ▼
                                 ┌──────────────────────────┐
                                 │  Spring Boot 3.x Backend │
                                 │  • BillingPriorityService│
                                 │  • ClaimService          │
                                 │  • PaymentService        │
                                 │       Port: 8080         │
                                 └──────┬────────────▲──────┘
                                        │            │
                         CRUD & History │            │ /predict
                                        ▼            ▼
                         ┌─────────────────┐   ┌──────────────────────────┐
                         │ MongoDB Database│   │  Python FastAPI Service  │
                         │   rcm_insight   │   │  (Random Forest ML Model)│
                         │   Port: 27017   │   │       Port: 8000         │
                         └─────────────────┘   └──────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technologies Used | Port |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, JavaScript, React Router v6, Axios, Recharts, Lucide Icons, Custom CSS tokens | `5173` |
| **Backend** | Java 17+, Spring Boot 3.2.3, Spring Web, Spring Data MongoDB, Bean Validation, WebSocket | `8080` |
| **AI / Machine Learning** | Python 3.10+, FastAPI, Scikit-Learn (RandomForestClassifier), Pandas, NumPy, Joblib | `8000` |
| **Database** | MongoDB (`rcm_insight` database, auto-seeded with realistic synthetic claims) | `27017` |

---

## 4. Smart Billing Priority Queue Formula

The Smart Priority Queue ranks unpaid claims strictly based on financial and payment factors (**NOT AI denial risk**):

$$\text{Billing Priority Score} = (\text{Amount Score} \times 0.70) + (\text{Pending Days Score} \times 0.30)$$

### Amount Score (70% Weight)
- **₹0**: `0`
- **₹1 – ₹10,000**: `20`
- **₹10,001 – ₹25,000**: `40`
- **₹25,001 – ₹50,000**: `60`
- **₹50,001 – ₹1,00,000**: `80`
- **Above ₹1,00,000**: `100`

### Pending Days Score (30% Weight)
- **0–3 days**: `10`
- **4–7 days**: `25`
- **8–15 days**: `50`
- **16–30 days**: `75`
- **More than 30 days**: `100`

### Priority Levels
- **80 – 100**: `CRITICAL` (Red)
- **55 – 79**: `HIGH` (Orange)
- **30 – 54**: `MEDIUM` (Yellow)
- **0 – 29**: `LOW` (Green)

*Note: Fully paid claims (`paymentStatus == PAID` or `pendingAmount == 0`) automatically disappear from the priority queue.*

---

## 5. Demonstration Workflows

### 🎯 Feature Demo: Smart Billing Priority Queue & Partial Payments
1. Open the **Dashboard** (`http://localhost:5173` or `http://localhost:5174`).
2. Observe the **Total Outstanding** (e.g. ₹4.15L) and **High-Priority Outstanding** (e.g. ₹3.45L) KPI cards.
3. Inspect the **Smart Billing Priority Queue** table directly below the KPI cards:
   - **`CLM3001`** (Nova Health, ₹1,00,000 pending, 20 days) ➔ **CRITICAL (Score: 93)** at the very top.
   - **`CLM3003`** (MediSecure, ₹70,000 pending, 32 days) ➔ **CRITICAL (Score: 86)**.
   - **`CLM3002`** (CareShield, ₹25,000 pending, 12 days) ➔ **MEDIUM (Score: 43)** ranked lower.
4. Click **FOLLOW UP** on `CLM3001`:
   - Modal displays the financial overview.
   - Enter **₹70,000** under *Record Partial Payment* and click **Record Payment**.
   - Remaining balance becomes **₹30,000**; priority score automatically recalculates and drops from **CRITICAL (93)** ➔ **HIGH (65)**.
5. Click **Settle Full Remaining Balance (₹30,000)**:
   - Claim status transitions to **`PAID`**.
   - Claim **automatically disappears** from the Smart Billing Priority Queue.
   - **Total Outstanding** decreases, and **Revenue Collected** increases live on the dashboard.

---

### 🎯 Core Demo: Pre-Submission AI Denial Risk Prevention
1. Navigate to **Create Claim** (`/create-claim`) or click **⚡ Quick Fill: Scenario 1 (CLM2055)**.
2. Claim with missing prior authorization triggers **84% High Risk** with actionable root cause explanation.
3. Click **Edit / Correct**, toggle Authorization to `Yes`, and re-run check ➔ Risk drops to **22% Low Risk**.
4. Submit claim ➔ Status becomes **`ACCEPTED`** ➔ Process payment ➔ Status becomes **`PAID`**.

---

## 6. REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/billing-priority` | Returns unpaid claims sorted by `billingPriorityScore DESC`, then `pendingAmount DESC` |
| `POST` | `/api/claims/{id}/partial-payment` | Records partial payment, reduces pending amount, re-ranks priority score |
| `POST` | `/api/claims/{id}/follow-up` | Logs billing staff follow-up note in audit timeline |
| `GET` | `/api/dashboard/metrics` | Returns KPI cards (Total Outstanding, High-Priority Due, Revenue, Denial Rates) |
| `GET` | `/api/claims` | List all claims |
| `POST` | `/api/claims` | Create a new claim |
| `GET` | `/api/claims/{id}` | Inspect claim details |
| `POST` | `/api/claims/{id}/predict` | Run AI Random Forest denial risk audit |
| `POST` | `/api/claims/{id}/submit` | Submit claim with automated payer adjudication simulation |
| `POST` | `/api/claims/{id}/pay` | Settle full balance and mark claim as `PAID` |

---

## 7. Team & Hackathon Credits
- **Team Name**: XIRO TECH
- **Project**: RCM INSIGHT
- **Tagline**: Predict • Prevent • Monitor • Improve
