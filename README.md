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

## 3. How to Run Locally in the Terminal

You can run the entire RCM Insight system on your local machine using 3 separate terminal tabs (or with the 1-click batch script).

### ⚡ Option A: 1-Click Startup (Windows)
Double-click or run from the project root:
```cmd
start-all.bat
```
*(This automatically opens 3 separate terminal windows for Python ML, Spring Boot Backend, and React Frontend).*

---

### 💻 Option B: Step-by-Step Terminal Commands

#### 🔹 Terminal 1: Python ML Service (Port 8000)
```bash
# 1. Navigate to ml-service directory
cd ml-service

# 2. (Optional) Create & activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. (Optional) Train/re-train model & create synthetic dataset
python train_model.py

# 5. Start the FastAPI microservice
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```
*API Swagger Docs available at:* `http://localhost:8000/docs`

---

#### 🔹 Terminal 2: Java Spring Boot Backend (Port 8080)
Ensure MongoDB is running locally (`mongodb://localhost:27017/rcm_insight`) or set `MONGODB_URI` to your MongoDB Atlas string.

```bash
# 1. Navigate to backend directory
cd backend

# 2. Run with Maven Wrapper (No global Maven installation required!):
# On Windows PowerShell:
.\mvnw.ps1 spring-boot:run

# On Windows Command Prompt (CMD):
mvnw.cmd spring-boot:run

# If you have global Maven installed:
mvn spring-boot:run
```
*Backend Health Check:* `http://localhost:8080/api/health`

---

#### 🔹 Terminal 3: React.js Frontend (Port 5173)
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (first time only)
npm install

# 3. Start Vite development server
npm run dev
```
*Dashboard opens at:* `http://localhost:5173`

---

## 4. MongoDB Atlas Cloud Database Setup

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

## 5. Railway Backend Deployment Guide

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

## 6. Connect Vercel Frontend to Railway Backend

1. Open your Vercel project dashboard at [vercel.com](https://vercel.com).
2. Go to **Settings** ➔ **Environment Variables**.
3. Add / Update:
   * **Key**: `VITE_API_URL`
   * **Value**: `https://YOUR-RAILWAY-URL/api` *(replace with your real Railway domain)*
4. Go to **Deployments** ➔ Click **Redeploy** on the latest build to pick up the new environment variable.
5. Open **[https://rcm-50.vercel.app](https://rcm-50.vercel.app/)** in your browser. All API requests now route securely to your Railway cloud backend and MongoDB Atlas!

---

## 7. Global CORS Configuration

The backend is configured with strict, production-ready CORS in `CorsConfig.java`:
* **Allowed Production Origin**: `https://rcm-50.vercel.app` (and `${FRONTEND_URL}`)
* **Allowed Local Development**: `http://localhost:5173`, `http://localhost:5174`, `http://localhost:3000`
* **Allowed Methods**: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
* **Allowed Headers**: `Content-Type`, `Authorization`, `Accept`, `X-Requested-With`, `Origin`
* **Credentials**: Enabled (`allowCredentials(true)`)
* **Preflight Cache**: `maxAge(3600)`

---

## 8. Smart Billing Priority Queue Formula

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

## 9. Accounts Receivable (AR) Aging Dashboard

The **AR Aging Dashboard** (`/ar-aging`) shows how much insurance money has not yet been received and categorizes unsettled hospital revenue by outstanding duration:

$$\text{Days Pending} = \text{Current Date} - \text{Claim Submitted Date}$$

### Aging Buckets & Status
* **`0–30 Days`**: `MONITOR` (Standard reimbursement adjudication cycle)
* **`31–60 Days`**: `FOLLOW UP` (Initial billing follow-up required)
* **`61–90 Days`**: `HIGH ATTENTION` (Escalation notice to payer)
* **`90+ Days`**: `CRITICAL` (High-priority management intervention)

### Strict Operational Rules
* **No AI Denial Risk**: Buckets depend strictly on financial age and unpaid balance.
* **Partial Payment Retention**: Partial payments reduce `pendingAmount` but do **not** reset `daysPending` (aging remains calculated from submission).
* **Automatic Settlement Removal**: Once `pendingAmount == 0` (or status is `PAID`), the claim is marked `PAID/CLOSED` and **disappears from active AR aging**.

### AR Showcase Claims
* `CLM6001`: Total ₹1,00,000 | Paid ₹20,000 | Pending ₹80,000 | 20 days ➔ **`0–30 Days`** (MONITOR)
* `CLM6002`: Total ₹90,000 | Paid ₹10,000 | Pending ₹80,000 | 45 days ➔ **`31–60 Days`** (FOLLOW UP)
* `CLM6003`: Total ₹1,20,000 | Paid ₹20,000 | Pending ₹1,00,000 | 75 days ➔ **`61–90 Days`** (HIGH ATTENTION)
* `CLM6004`: Total ₹1,50,000 | Paid ₹30,000 | Pending ₹1,20,000 | 110 days ➔ **`90+ Days`** (CRITICAL)

---

## 10. Verification & Persistence Test Flow (CLM5001 & CLM6004)

You can verify the end-to-end cloud pipeline using these test cases:

### Test Case A: AR Aging Demo Flow (CLM6004)
1. Open **AR Aging** (`/ar-aging`) ➔ View Top 4 KPIs & click **`90+ DAYS`** bucket card.
2. Select **`CLM6004`** (₹1,20,000 pending, 110 days).
3. Click **Pay** ➔ Record partial payment of **₹70,000**.
4. Balance drops to **₹50,000** (remains in 90+ bucket; total outstanding drops by ₹70,000).
5. Click **Settle** ➔ Confirm final **₹50,000** payment.
6. Status becomes **`PAID`** ➔ Claim **automatically disappears** from active AR aging table!

### Test Case B: Billing Priority Flow (CLM5001)
1. **Create Claim**: Claim ID `CLM5001`, Total Bill `₹1,00,000`
2. **Initial Payment**: Record `₹20,000` ➔ Status `PARTIALLY_PAID`, Pending `₹80,000` (High Priority in Priority Queue).
3. **Partial Payment**: Record `₹60,000` ➔ Paid `₹80,000`, Pending `₹20,000` (Priority auto-reduces to `MEDIUM`).
4. **Final Settlement**: Settle final `₹20,000` ➔ Pending `₹0`, Status `PAID` ➔ Disappears from priority queue!

---

## 11. Core REST APIs

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck returning status UP and MongoDB Atlas confirmation |
| `GET` | `/api/ar-aging/summary` | AR Aging KPIs (Total Outstanding, Avg/Oldest Days, 4-bucket breakdown) |
| `GET` | `/api/ar-aging/claims` | List AR claims sorted by daysPending DESC, supports `?bucket=90+` |
| `POST` | `/api/ar-aging/claims/{id}/follow-up` | Record billing follow-up notes, status, and next schedule |
| `GET` | `/api/dashboard/metrics` | Dynamic KPIs (Total Claims, Total Outstanding, High-Priority Due, Revenue) |
| `GET` | `/api/billing-priority` | Real-time queue sorted by `billingPriorityScore DESC`, then `pendingAmount DESC` |
| `GET` | `/api/claims` | List all claims from MongoDB |
| `POST` | `/api/claims` | Create a new claim with auto-calculated billing priority & AR aging |
| `GET` | `/api/claims/{id}` | Inspect individual claim |
| `POST` | `/api/claims/{id}/payment` | Record full or partial payment (recalculates priority & AR balance) |
| `POST` | `/api/claims/{id}/predict` | Pre-submission AI denial check (Random Forest) |
| `POST` | `/api/claims/{id}/submit` | Submit claim via simulated EDI 837 network |
| `POST` | `/api/claims/{id}/accept` | Simulate payer adjudication approval |
| `POST` | `/api/claims/{id}/deny` | Simulate payer denial with root-cause reason |
| `POST` | `/api/claims/{id}/resubmit` | Resubmit corrected claim |
| `GET` | `/api/alerts` | Line-by-line proactive alerts feed |
| `PUT` | `/api/alerts/{id}/resolve` | Mark single alert as read and move to All History |
| `PUT` | `/api/alerts/resolve-all` | Bulk mark all active alerts as read |

---

## 12. Repository & Team
* **GitHub Repository**: [https://github.com/BalaKrishnan02/Revenue-Cycle-Command-Center](https://github.com/BalaKrishnan02/Revenue-Cycle-Command-Center)
* **Frontend Production URL**: [https://rcm-50.vercel.app](https://rcm-50.vercel.app/)
* **Team**: XIRO TECH
