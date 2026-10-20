# Obi's Snack Spot

An online ordering platform and admin management portal for Obi's Snack Spot, featuring customer ordering, menu exploration, WhatsApp integration, staff/admin dashboard, and database persistence.

---

## Project Structure

The project follows a standard production fullstack architecture separating frontend assets, backend server logic, models, routes, persistent data, and automated tests:

```text
Obis-snacks-spot/
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules for node_modules, .env, and logs
├── package.json              # Project dependencies and npm scripts
├── package-lock.json         # Pinned dependency versions
├── README.md                 # Project documentation and setup guide
├── server.js                 # Express server entry point & API routes
├── vercel.json               # Vercel deployment configuration
│
├── public/                   # Public static frontend files (served to the browser)
│   ├── index.html            # Main customer storefront & ordering interface
│   ├── admin.html            # Admin operations dashboard
│   ├── admin-dashboard.html  # Supabase-integrated order dashboard
│   ├── backend.html          # Store & order management portal
│   ├── customer-account.html # Customer profile & order history
│   ├── customer-login.html   # Customer sign-in page
│   ├── customer-signup.html  # Customer account registration
│   ├── login.html            # Staff & unified PIN login
│   ├── redirect.html         # OAuth redirect handler
│   ├── thankyou.html         # Order confirmation & receipt
│   │
│   ├── css/                  # Stylesheets
│   │   ├── style.css         # Storefront & ordering styles
│   │   ├── admin.css         # Admin dashboard styles
│   │   └── login.css         # Authentication pages styles
│   │
│   └── js/                   # Client-side JavaScript
│       ├── script.js         # Storefront interactivity & cart management
│       ├── admin.js          # Admin dashboard logic
│       ├── admin-dashboard.js# Supabase admin dashboard logic
│       ├── auth.js           # Authentication & session client logic
│       ├── backend.js        # Backend management portal script
│       ├── login.js          # Login & PIN verification script
│       └── supabase-config.js# Supabase client configuration
│
├── src/                      # Backend application modules
│   ├── models/
│   │   └── Order.js          # Mongoose order schema & model
│   └── routes/
│       └── orders.js         # Order API endpoints & business logic
│
├── data/                     # Persistent local fallback storage
│   └── store.json            # JSON store used when external DB is offline
│
├── supabase/                 # Supabase database configuration & schemas
│   ├── config.toml           # Supabase CLI configuration
│   └── schema.sql            # PostgreSQL table schema & policies
│
└── tests/                    # Automated tests
    └── auth.test.js          # Authentication & PIN hashing tests
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or higher)
- npm (bundled with Node.js)

### Installation
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment variables template and configure your secrets:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` values:
   - `JWT_SECRET`: A long random string for signing session cookies.
   - `AUTH_PIN`: A secure PIN for staff/PIN authentication.
   - `MONGODB_URI` *(optional)*: MongoDB connection string for orders.
   - `ADMIN_USERNAME` & `ADMIN_PASSWORD`: Credentials for the admin portal (default: `admin` / `admin123`).
   - `PORT`: Server port (default: `3000`).

---

## Running the Application

### Development Server
```bash
npm run dev
```
Starts the server at [http://localhost:3000](http://localhost:3000).

### Run Automated Tests
```bash
npm test
```
Executes the test suite located in `tests/`.

---

## Key Pages & Endpoints

| URL Path | Description | Access |
|---|---|---|
| `/` or `/index.html` | Customer food ordering website | Public / Customer Session |
| `/login.html` | Staff & customer PIN sign-in | Public |
| `/customer-login.html` | Customer email & password login | Public |
| `/customer-signup.html` | New customer registration | Public |
| `/customer-account.html` | Customer account details | Authenticated Customers |
| `/admin` or `/admin.html` | Admin dashboard & analytics | Staff / Admin |
| `/api/health` | Healthcheck endpoint | Public |
| `/api/orders` | Customer and admin order API | Authenticated |

---

## Security Architecture

- **Public Directory Isolation**: The server strictly serves static files from `public/`. Sensitive backend files (e.g. `.env`, `server.js`, `package.json`, database files) are never exposed directly to web clients.
- **HTTP-Only Cookies**: Authentication sessions use secure, HTTP-only signed cookies to prevent XSS session theft.
- **Safe Fallbacks**: If MongoDB or Supabase are temporarily unavailable, local JSON persistence (`data/store.json`) enables continuous operation.
