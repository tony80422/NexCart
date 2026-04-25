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
    ├── nexcart-frontend/       # React + Vite frontend
    │   ├── src/
    │   │   ├── api/            # API client modules
    │   │   ├── components/     # UI components (admin / customer / merchant / common)
    │   │   ├── hooks/          # Custom React hooks
    │   │   ├── pages/          # Page-level components
    │   │   └── utils/          # Helpers (token, guards, format)
    │   ├── .env
    │   └── vite.config.js
    │
    └── nexcart-backend/        # Express + MongoDB backend
        ├── src/
        │   ├── config/         # DB connection & app config
        │   ├── middleware/      # Auth & role middleware
        │   ├── models/         # Mongoose models (User, Product, Order, Cart, Alert)
        │   ├── routes/         # Route handlers
        │   ├── services/       # Auth, logging, notification, storage services
        │   └── server.js       # Entry point
        ├── scripts/            # Database seed scripts
        └── .env
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

Verify the `.env` file exists at `nexcart-demo/nexcart-backend/.env`. Default values:

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

AWS_S3_BUCKET=
AWS_SNS_TOPIC_ARN=
AWS_COGNITO_USER_POOL_ID=
AWS_COGNITO_CLIENT_ID=
```

### 2. Frontend

```bash
cd nexcart-demo/nexcart-frontend
npm install
```

Verify the `.env` file exists at `nexcart-demo/nexcart-frontend/.env`. Default values:

```env
VITE_API_BASE_URL=http://localhost:4000/api

VITE_AWS_REGION=us-east-1

VITE_USE_AWS_API_GATEWAY=false
VITE_AWS_API_GATEWAY_URL=

VITE_USE_AWS_COGNITO=false
VITE_AWS_COGNITO_USER_POOL_ID=
VITE_AWS_COGNITO_CLIENT_ID=

VITE_AWS_S3_PUBLIC_BASE_URL=
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

## Seed the Database (Optional)

Populate the database with sample data:

```bash
cd nexcart-demo/nexcart-backend

npm run seed:users       # Create default users for all roles
npm run seed:products    # Add sample products
npm run seed:orders      # Add sample orders
npm run seed:alerts      # Add sample admin alerts
```

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
| `/api/aws` | AWS service integration endpoints |

---

## AWS Integration (Optional)

AWS services are disabled by default and can be toggled in `.env`:

```env
# Backend
AWS_USE_S3=true           # File/image storage
AWS_USE_SNS=true          # Notification alerts
AWS_USE_CLOUDWATCH=true   # Logging & monitoring
AWS_USE_COGNITO=true      # Cloud-based authentication

# Frontend
VITE_USE_AWS_COGNITO=true
VITE_USE_AWS_API_GATEWAY=true
VITE_AWS_API_GATEWAY_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
```