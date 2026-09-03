# RCM INSIGHT
### AI-Powered Real-Time Revenue Cycle Command Center & Smart Billing Priority Queue
> **"Predict • Prevent • Monitor • Improve"**  
> Developed by **Team XIRO TECH**

---

## 1. Production Deployment Architecture

```
                                  ┌───────────────────────────┐
                                  │    Billing Specialist     │
                                  │      / RCM Leadership     │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                   ┌─────────────────────────┐
                                   │    Vercel Frontend      │
                                   │  React 18 + Vite (SPA)  │
                                   │ https://rcm-50.vercel.app│
                                   └────────────┬────────────┘
                                                │
                                 HTTPS / REST   │ VITE_API_URL
                                                ▼
                                   ┌─────────────────────────┐
                                   │     Railway Backend     │
                                   │    Java 17 Spring Boot  │
                                   │   Port: ${PORT:8080}    │
                                   └──────┬───────────▲──────┘
                                          │           │
                    MONGODB_URI           │           │ ML_SERVICE_URL
                    Driver Connection     │           │ /predict
                                          ▼           ▼
                           ┌─────────────────────┐  ┌─────────────────────────┐
                           │    MongoDB Atlas    │  │  Python FastAPI ML Svc  │
                           │   Cloud Database    │  │  (Random Forest Engine) │
                           │     rcm_insight     │  │       Port: 8000        │
                           └─────────────────────┘  └─────────────────────────┘
```

---

## 2. Cloud Components & Live URLs

| Component | Technology | Hosting Platform | URL / Connection |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Recharts, Lucide Icons | **Vercel** | **[https://rcm-50.vercel.app](https://rcm-50.vercel.app/)** |
| **Backend** | Java 17, Spring Boot 3.2.3, Spring Data | **Railway** | `https://YOUR-RAILWAY-BACKEND.up.railway.app` |
| **Database** | MongoDB Cloud Cluster | **MongoDB Atlas** | Database: `rcm_insight` (`${MONGODB_URI}`) |
| **ML Engine** | Python 3.10+, FastAPI, Scikit-Learn | **Railway / Render** | `${ML_SERVICE_URL}` (Embedded fallback included) |

---

## 3. MongoDB Atlas Cloud Database Setup

Follow these exact steps to prepare your MongoDB Atlas cloud database:

1. **Open MongoDB Atlas**: Log in at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Create Project**: Name the project `RCM Insight`.
3. **Deploy a Free Cluster**: Choose **M0 Free Tier** (AWS or GCP region closest to you).
4. **Create Database User**:
   * Navigate to **Security** ➔ **Database Access**.
   * Add a new database user (e.g. `rcm_admin`).
   * Generate a secure password and save it safely.
   * Grant role: `Read and write to any database`.
5. **Configure Network Access**:
   * Navigate to **Security** ➔ **Network Access**.
   * Click **Add IP Address** ➔ Select **Allow Access from Anywhere (`0.0.0.0/0`)** so Railway cloud containers can connect.
6. **Get Connection String**:
   * Navigate to **Database** ➔ Click **Connect** on your cluster.
   * Choose **Drivers** (Driver: `Java`, Version: `4.3 or later`).
   * Copy the connection string. It will look like:
     ```
     mongodb+srv://rcm_admin:<password>@cluster0.xxxxx.mongodb.net/rcm_insight?retryWrites=true&w=majority
     ```
   * Replace `<password>` with your database user password and ensure the database name is `rcm_insight`.
7. **Store in Railway**: Save this complete URI as the `MONGODB_URI` environment variable in Railway. *(Never commit passwords to Git!)*

---

## 4. Railway Backend Deployment Guide

The Spring Boot backend is pre-configured with a multi-stage Docker build and Maven packaging.

### Step 1: Deploy on Railway
1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** ➔ **Deploy from GitHub repo**.
3. Select your repository: `BalaKrishnan02/Revenue-Cycle-Command-Center`.
4. Railway automatically detects the project `Dockerfile` and builds the Java 17 container using `mvn clean package -DskipTests`.

### Step 2: Configure Railway Environment Variables
In your Railway Service ➔ **Variables**, add the following:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster.mongodb.net/rcm_insight?retryWrites=true&w=majority` | MongoDB Atlas Cloud URI |
| `FRONTEND_URL` | `https://rcm-50.vercel.app` | Allowed CORS Production Origin |
| `PORT` | `8080` | Assigned automatically by Railway |
| `ML_SERVICE_URL` | `http://localhost:8000` *(or your deployed ML URL)* | Python AI denial service |

### Step 3: Generate Public Domain & Test Health
1. In Railway Service ➔ **Settings** ➔ **Networking** ➔ Click **Generate Domain**.
2. Example generated URL: `https://rcm-insight-backend.up.railway.app`.
3. Verify the public health endpoint:
   ```bash
   curl -i https://YOUR-RAILWAY-URL/api/health
   ```
   **Expected Response**:
   ```json
   {
     "status": "UP",
     "service": "RCM Insight Backend",
     "database": "MongoDB Atlas"
   }
   ```

---

## 5. Connect Vercel Frontend to Railway Backend

1. Open your Vercel project dashboard at [vercel.com](https://vercel.com).
2. Go to **Settings** ➔ **Environment Variables**.
3. Add / Update:
   * **Key**: `VITE_API_URL`
   * **Value**: `https://YOUR-RAILWAY-URL/api` *(replace with your real Railway domain)*
4. Go to **Deployments** ➔ Click **Redeploy** on the latest build to pick up the new environment variable.
5. Open **[https://rcm-50.vercel.app](https://rcm-50.vercel.app/)** in your browser. All API requests now route securely to your Railway cloud backend and MongoDB Atlas!

---

## 6. Global CORS Configuration

The backend is configured with strict, production-ready CORS in `CorsConfig.java`:
* **Allowed Production Origin**: `https://rcm-50.vercel.app` (and `${FRONTEND_URL}`)
* **Allowed Local Development**: `http://localhost:5173`, `http://localhost:5174`, `http://localhost:3000`
* **Allowed Methods**: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
* **Allowed Headers**: `Content-Type`, `Authorization`, `Accept`, `X-Requested-With`, `Origin`
* **Credentials**: Enabled (`allowCredentials(true)`)
* **Preflight Cache**: `maxAge(3600)`

---

## 7. Smart Billing Priority Queue Formula

The Smart Priority Queue prioritizes unpaid hospital claims strictly by financial urgency (**NOT AI denial risk**):

$$\text{Billing Priority Score} = (\text{Amount Score} \times 0.70) + (\text{Pending Days Score} \times 0.30)$$

### Amount Score (70% Weight)
* **₹0**: `0`
* **₹1 – ₹10,000**: `20`
* **₹10,001 – ₹25,000**: `40`
* **₹25,001 – ₹50,000**: `60`
* **₹50,001 – ₹1,00,000**: `80`
* **Above ₹1,00,000**: `100`

### Pending Days Score (30% Weight)
* **0–3 days**: `10`
* **4–7 days**: `25`
* **8–15 days**: `50`
* **16–30 days**: `75`
* **More than 30 days**: `100`

### Dynamic Status & Auto-Removal
* **`CRITICAL` (80–100)** ➔ **`HIGH` (55–79)** ➔ **`MEDIUM` (30–54)** ➔ **`LOW` (0–29)**.
* When a partial payment is recorded, the pending balance decreases and the score automatically drops.
* When the remaining balance is paid in full (`pendingAmount == 0`), status becomes **`PAID`** and the claim **automatically disappears** from the priority queue.

---

## 8. Verification & Persistence Test Flow (CLM5001)

You can verify the end-to-end cloud pipeline using this test case:

1. **Create Claim**:
   * Claim ID: `CLM5001`, Total Bill: `₹1,00,000`
2. **Initial Payment**:
   * Record payment of `₹20,000` ➔ Status: `PARTIALLY_PAID`, Pending: `₹80,000`.
   * Appears near the top of the **Smart Billing Priority Queue** with **`HIGH` / `CRITICAL`** priority.
3. **Partial Payment**:
   * Record payment of `₹60,000` ➔ Paid: `₹80,000`, Pending: `₹20,000`.
   * Priority automatically reduces to **`MEDIUM`**.
4. **Final Settlement**:
   * Settle final `₹20,000` ➔ Pending: `₹0`, Status: `PAID`.
   * Automatically removed from the priority queue.
   * Dashboard **Revenue Collected** increases and **Total Outstanding** decreases!
5. **Persistence Verification**:
   * Refresh `https://rcm-50.vercel.app` ➔ All data remains persistent from MongoDB Atlas!

---

## 9. Core REST APIs

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck returning status UP and MongoDB Atlas confirmation |
| `GET` | `/api/dashboard/metrics` | Dynamic KPIs (Total Claims, Total Outstanding, High-Priority Due, Revenue) |
| `GET` | `/api/billing-priority` | Real-time queue sorted by `billingPriorityScore DESC`, then `pendingAmount DESC` |
| `GET` | `/api/claims` | List all claims from MongoDB |
| `POST` | `/api/claims` | Create a new claim with auto-calculated billing priority |
| `GET` | `/api/claims/{id}` | Inspect individual claim |
| `POST` | `/api/claims/{id}/payment` | Record full or partial payment (recalculates priority) |
| `POST` | `/api/claims/{id}/predict` | Pre-submission AI denial check (Random Forest) |
| `POST` | `/api/claims/{id}/submit` | Submit claim via simulated EDI 837 network |
| `POST` | `/api/claims/{id}/accept` | Simulate payer adjudication approval |
| `POST` | `/api/claims/{id}/deny` | Simulate payer denial with root-cause reason |
| `POST` | `/api/claims/{id}/resubmit` | Resubmit corrected claim |
| `GET` | `/api/alerts` | Line-by-line proactive alerts feed |
| `PUT` | `/api/alerts/{id}/resolve` | Mark single alert as read and move to All History |
| `PUT` | `/api/alerts/resolve-all` | Bulk mark all active alerts as read |

---

## 10. Repository & Team
* **GitHub Repository**: [https://github.com/BalaKrishnan02/Revenue-Cycle-Command-Center](https://github.com/BalaKrishnan02/Revenue-Cycle-Command-Center)
* **Frontend Production URL**: [https://rcm-50.vercel.app](https://rcm-50.vercel.app/)
* **Team**: XIRO TECH
