# NexCart

A cloud-oriented e-commerce platform demo featuring multi-role access control, secure JWT authentication, MongoDB persistence, and an admin monitoring dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB |
| Auth | JWT + bcryptjs |

## Project Structure

```
NexCart/
└── nexcart-demo/
    ├── nexcart-frontend/   # React + Vite frontend
    └── nexcart-backend/    # Express + MongoDB backend
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port `27017`

---

## Installation

### 1. Backend

```bash
cd nexcart-demo/nexcart-backend
npm install
```

Create a `.env` file in the `nexcart-backend` folder (or edit the existing one):

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/nexcart_demo
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1d

APP_ENV=local
AUTH_PROVIDER=local

AWS_REGION=us-east-1
AWS_USE_S3=false
AWS_USE_SNS=false
AWS_USE_CLOUDWATCH=false
AWS_USE_COGNITO=false
```

(Optional) Seed the database with default users:

```bash
npm run seed
```

### 2. Frontend

```bash
cd nexcart-demo/nexcart-frontend
npm install
```

---

## Running the App

### Start the Backend

```bash
cd nexcart-demo/nexcart-backend
npm start
```

Backend will be available at: `http://localhost:4000`

Health check: `GET http://localhost:4000/api/health`

### Start the Frontend

Open a **new terminal**, then:

```bash
cd nexcart-demo/nexcart-frontend
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## User Roles

| Role | Access |
|------|--------|
| **Consumer** | Browse products, manage cart, place orders, view order history |
| **Merchant** | Manage own products, view & update order status, wallet |
| **Admin** | Platform dashboard, user management, all orders & products, alerts |

---

## API Overview

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Register, login, logout, current user |
| `/api/products` | Public product listing |
| `/api/customer` | Cart and order operations (consumer) |
| `/api/merchant` | Product & order management (merchant) |
| `/api/admin` | Dashboard, user/order/alert management (admin) |

---

## AWS Integration (Optional)

AWS services are disabled by default. Toggle them via `.env`:

```env
AWS_USE_S3=true          # File/image storage
AWS_USE_SNS=true         # Notification alerts
AWS_USE_CLOUDWATCH=true  # Logging & monitoring
AWS_USE_COGNITO=true     # Cloud-based authentication
```