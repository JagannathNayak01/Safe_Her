# Safe_Her
🛡️ SafeHer — A real-time women's safety &amp; emergency alert platform. One-tap SOS with live GPS tracking, SMS (Twilio) &amp; email alerts, OTP-verified registration, and full emergency contact management. Built with React, Node.js, Express &amp; MongoDB.



# 🛡️ SafeHer — Women Safety & Emergency Alert System

> **Real-time personal safety platform** — one-tap SOS, live location sharing, email + SMS alerts, OTP-verified registration, and full emergency contact management.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white&style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white&style=flat-square)
![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white&style=flat-square)
![JWT](https://img.shields.io/badge/Auth-JWT-FB015B?logo=jsonwebtokens&logoColor=white&style=flat-square)
![Twilio](https://img.shields.io/badge/SMS-Twilio-F22F46?logo=twilio&logoColor=white&style=flat-square)
![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [UI & Design System](#ui--design-system)
- [Loading States & UX](#loading-states--ux)
- [Animations](#animations)
- [Security](#security)
- [Notes](#notes)

---

## Overview

SafeHer is a full-stack **MERN** web application designed to improve personal safety for women. When an SOS is triggered:

1. 📧 **Email** — backend sends an HTML alert email with a live Google Maps link to every emergency contact that has an email address (via nodemailer + Gmail)
2. 📱 **SMS** — backend dispatches real SMS messages to all emergency contacts' phone numbers via the **Twilio API**
3. 🗺️ **Location** — live GPS coordinates are logged to the database and shown on an embedded map

All emergency contacts, incidents, and profile data are scoped to the authenticated user via JWT — no data leaks between accounts.

---

## ✨ Features

### 🆘 Emergency SOS
- Single-tap SOS from **any page** via a global floating action button
- Broadcasts live GPS coordinates to all emergency contacts
- **Email alerts** delivered instantly via nodemailer (HTML email, Google Maps link)
- **SMS alerts** sent server-side via **Twilio** to all contacts with a phone number
- **Glassmorphism loader overlay** with animated shield icon during SOS sending
- **SOS button pulse animation** while alert is being dispatched
- Incident automatically saved to the database and shown in History

### 🔐 Multi-Step Registration with OTP Verification
- **3-step signup wizard** with animated step transitions:
  - **Step 1**: Name, Email, Phone number
  - **Step 2**: Password (with live strength meter) + Confirm Password (with match indicator)
  - **Step 3**: 6-digit OTP verification via email
- Beautiful branded OTP email template with gradient code display
- Auto-focus OTP input boxes with paste support
- Resend OTP with 60-second cooldown timer
- SHA-256 hashed OTP stored in database with 10-minute expiry
- Unverified users blocked from logging in
- Re-registration allowed for unverified accounts (overwrites previous attempt)

### 👤 User Profile & Avatar
- View and edit name and email
- Upload a **profile picture** — stored as Base64 in MongoDB (no file server needed)
- Avatar shown in Navbar and Profile page; updates live without page refresh via custom `safeher:avatar-updated` event
- Change password with current-password verification
- Remove profile picture
- **Skeleton loading** for profile page with avatar circle + field shimmer

### 📇 Emergency Contact Management

| Feature | Detail |
|---|---|
| Add / Edit / Delete | Full CRUD via modal forms with button loading spinners |
| Bulk Delete | Select multiple + styled confirmation modal (matches individual delete popup) |
| Fields | Name, Phone, Email, Gender, ID, Address, Relationship |
| Auth-protected | Every route is scoped to the logged-in user |
| Input validation | Name + phone required; clear 400 error messages |
| Search & Sort | Real-time filter + column sort (asc/desc) |
| Pagination | 5 contacts per page |
| Stats bar | Live counters for Total / Showing / Selected |
| Skeleton Loading | Shimmer table rows while contacts are being fetched |
| Animated rows | Staggered slide-in, delete fade-out |

### 📊 Dashboard
- Animated one-tap SOS trigger panel with triple pulse rings
- Sends dual alert (email via nodemailer + SMS via Twilio — both server-side)
- **Glassmorphism loader overlay** with animated shield + bouncing dots during SOS
- **SOS button pulse animation** while loading
- Embedded Google Maps showing live location after SOS
- Paginated recent incident overview with skeleton loading

### 🕐 SOS Alert History
- Full paginated log of every alert triggered
- Shows timestamp, GPS coordinates (→ opens in Google Maps), contacts notified
- 3-stat summary strip: Total Alerts · Last Alert Date · People Notified
- Skeleton loading cards, smooth page-change animation

### 🏠 Landing Page (Guest Home)
- Animated hero with floating orbs and live shield icon
- Stats strip (50k+ users, 12k+ alerts, 120+ cities)
- Six-card feature grid with glassmorphic hover reveals
- Interactive "How It Works" timeline
- Testimonial carousel
- Framer Motion scroll-triggered section reveals
- **anime.js** character-by-character text animations with proper cleanup

### 📖 About Page
- Animated hero with floating orb particles
- Live roll-up stat counters on scroll (with proper unmount cleanup)
- Mission / Vision split cards
- Company timeline (2022 → present)
- Team section with flip-card reveal (front: photo + bio, back: responsibilities)
- CTA with spinning shield icon

### 🔑 Password Reset
- Forgot password page → sends email with reset link
- Reset password page → validates token + sets new password
- Branded HTML email template

### 🚧 Error Handling
- Global `ErrorBoundary` component catches unexpected React render errors gracefully
- `NotFound` (404) page with navigation back to home
- Backend global JSON error handler — never exposes stack traces
- Proper animation cleanup on component unmount (prevents null ref crashes)

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 18 | UI framework |
| **React Router** | v6 | Client-side routing |
| **React.lazy + Suspense** | — | Code splitting & lazy loading for all page routes |
| **Framer Motion** | 12 | Page transitions, scroll animations, spring physics |
| **anime.js** | 4+ | Character-by-character text split animations |
| **Lucide React** | latest | Icon library |
| **Axios** | 1.5 | HTTP client with cookie-based auth |
| **TailwindCSS** | 3.4 | Utility-first CSS framework |
| **Vanilla CSS** + keyframes | — | Custom design system & animations (`main.css`, `loaders.css`) |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Node.js + Express** | 18+ / 4.18 | REST API server |
| **MongoDB + Mongoose** | Atlas / 7.5 | Database & ODM |
| **Helmet** | 8 | Security headers (CSP, HSTS, X-Frame-Options…) |
| **express-rate-limit** | 8 | Brute-force protection on auth (20 req/15 min) + SOS (20 alerts/hr in prod) |
| **bcryptjs** | 2.4 | Password hashing (10 salt rounds) |
| **jsonwebtoken** | 9 | JWT signing & verification |
| **nodemailer** | 8 | HTML email notifications (SOS alerts, OTP verification, password reset) |
| **Twilio** | 5 | Server-side SMS alerts to emergency contacts |
| **multer** | 2 | Avatar image upload (multipart/form-data) |
| **body-parser** | 1.20 | JSON request body parsing |
| **dotenv** | 16 | Environment configuration |
| **cors** | 2.8 | Cross-origin resource sharing |
| **nodemon** | 3 | Dev auto-reload |

---

## 📁 Project Structure

```
Safe_her/
├── .env.example                       # Template for all required environment variables
│
├── backend/
│   ├── controllers/
│   │   ├── authController.js          # Register (OTP) / Verify OTP / Resend OTP / Login / Logout / Forgot & Reset Password
│   │   ├── contactController.js       # Basic contact CRUD
│   │   └── incidentController.js      # SOS incident logging + email & Twilio SMS dispatch
│   ├── middleware/
│   │   ├── authMiddleware.js          # JWT verification (reads from httpOnly cookie)
│   │   ├── errorHandler.js            # Global JSON error handler
│   │   └── validators.js             # Input validation (register, login)
│   ├── models/
│   │   ├── User.js                    # User schema (name, email, password, phone, isVerified, otp, otpExpires)
│   │   ├── Contact.js                 # Basic contact schema
│   │   ├── EmergencyContact.js        # Emergency contact schema (user-scoped)
│   │   └── Incident.js                # SOS incident schema
│   ├── routes/
│   │   ├── auth.js                    # /api/auth/* (register, verify-otp, resend-otp, login, logout, forgot/reset password)
│   │   ├── contacts.js                # /api/contacts/*
│   │   ├── emergencyContacts.js       # /api/emergency-contacts/* (auth-protected)
│   │   ├── incidents.js               # /api/incidents/* (SOS rate-limited in prod)
│   │   └── profile.js                 # /api/profile/* (avatar upload, password change)
│   ├── uploads/avatars/               # Disk-cached avatar files (also stored in DB as base64)
│   ├── server.js                      # Express app entry point
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── api/
        │   └── api.js                 # Axios instance (cookie-based auth, withCredentials)
        ├── components/
        │   ├── common/
        │   │   ├── ErrorBoundary.js   # React error boundary for unexpected render failures
        │   │   ├── Footer.js          # Animated footer (particle bg, social links, theme toggle)
        │   │   ├── GlassLoader.js     # Glassmorphism full-page loader (animated shield + dots)
        │   │   ├── Navbar.js          # Top navigation + avatar + dropdown menu
        │   │   ├── PageShell.js       # Layout: Navbar + Footer + theme toggle + SOS FAB
        │   │   ├── PrivateRoute.js    # Auth guard for protected pages
        │   │   ├── Skeleton.js        # Reusable skeleton primitives (line, circle, card, table, profile)
        │   │   ├── SosAlertModal.js   # Floating SOS confirmation modal
        │   │   ├── Toast.js           # Global toast notification system
        │   │   └── TopLoader.js       # YouTube-style progress bar for navigation
        │   └── pages/
        │       ├── About.js           # Public about page (with proper animation cleanup)
        │       ├── Contacts.js        # Emergency contact management table + bulk delete modal
        │       ├── Dashboard.js       # SOS panel + GlassLoader + map + incident history
        │       ├── ForgotPassword.js  # Password reset request form
        │       ├── History.js         # Paginated SOS alert history with skeleton cards
        │       ├── Home.js            # Landing page (guest) / home (logged-in)
        │       ├── Login.js           # JWT login form with TopLoader integration
        │       ├── NotFound.js        # 404 page with back-to-home navigation
        │       ├── Profile.js         # Profile edit + avatar upload + password change + skeleton
        │       ├── Register.js        # 3-step registration wizard with OTP verification
        │       ├── ResetPassword.js   # Password reset form (token-validated)
        │       └── SOSAlert.js        # /sos route (auth-protected redirect helper)
        ├── context/
        │   ├── ToastContext.js        # Global toast state & provider
        │   └── TopLoaderContext.js     # Global progress bar state & provider
        ├── styles/
        │   ├── main.css               # Full design system + animation keyframes
        │   ├── loaders.css            # GlassLoader, skeleton, button loading styles
        │   └── output.css             # Compiled TailwindCSS output
        ├── App.js                     # Route definitions + ErrorBoundary + lazy loading
        └── index.js                   # React DOM entry point
```

---

## 🗺️ Pages & Routes

| Route | Component | Auth | Description |
|---|---|---|---|
| `/` | `Home` | Public | Premium landing page (guest) / quick-access home (logged-in) |
| `/about` | `About` | Public | About page with team, features, timeline, CTA |
| `/login` | `Login` | Public | JWT login form (blocks unverified users) |
| `/register` | `Register` | Public | 3-step registration: Profile → Password → OTP Verify |
| `/forgot-password` | `ForgotPassword` | Public | Password reset email request |
| `/reset-password/:token` | `ResetPassword` | Public | Token-validated password reset form |
| `/dashboard` | `Dashboard` | 🔒 Private | SOS trigger + GlassLoader + map + incident overview |
| `/contacts` | `Contacts` | 🔒 Private | Emergency contact management with skeleton + bulk delete |
| `/sos` | `SOSAlert` | 🔒 Private | SOS alert dedicated route |
| `/history` | `History` | 🔒 Private | Paginated SOS alert history |
| `/profile` | `Profile` | 🔒 Private | Edit profile, upload avatar, change password |
| `*` | `NotFound` | Public | 404 catch-all page |

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- **MongoDB** (local or [Atlas](https://cloud.mongodb.com))
- **Twilio account** (free trial works) — for SMS alerts
- **Gmail account** with 2FA enabled — for email alerts (SOS + OTP + password reset)

### 1. Clone the repository
```bash
git clone <repo-url> Safe_her
cd Safe_her
```

### 2. Configure environment variables
```bash
# Copy the example file and fill in your values
cp .env.example backend/.env
```
> See the [Environment Variables](#environment-variables) section below for details on each variable.

### 3. Start the backend
```bash
cd backend
npm install
npm run dev
```
> Server starts at `http://localhost:5000`

### 4. Start the frontend
```bash
cd ../frontend
npm install
npm start
```
> React app runs at `http://localhost:3000`

### 5. MongoDB
- **Local**: install MongoDB Community Edition and ensure `mongod` is running, set `MONGO_URI=mongodb://localhost:27017/safeher`
- **Atlas**: paste your Atlas connection string into `MONGO_URI` in `.env`
  > ⚠️ If your Atlas password contains special characters like `@`, URL-encode them: `@` → `%40`

---

## ⚙️ Environment Variables

Create `backend/.env` (or copy from `.env.example` in the project root):

```env
# App
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/safeher?retryWrites=true&w=majority

# Auth
JWT_SECRET=your_super_secret_key_min_32_chars

# Server
PORT=5000

# Email (nodemailer + Gmail) — used for SOS alerts, OTP verification, password reset
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_16_char_gmail_app_password

# SMS alerts (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+1XXXXXXXXXX

# Frontend URL (for password reset links)
FRONTEND_URL=http://localhost:3000

# Google Maps (optional — for interactive embedded map)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` or `production` — affects SOS rate limiter behaviour |
| `MONGO_URI` | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | Secret used for signing/verifying JWTs (keep this long and random) |
| `PORT` | Express server port (default: `5000`) |
| `EMAIL_USER` | Gmail address that sends SOS alerts, OTP codes, and password reset emails |
| `EMAIL_PASS` | Gmail **App Password** — generate at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) (requires 2FA) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID — found in the Twilio Console dashboard |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token — found in the Twilio Console dashboard |
| `TWILIO_FROM_NUMBER` | Twilio-provisioned phone number in E.164 format (e.g. `+12345678900`) |
| `FRONTEND_URL` | Frontend base URL — used in password reset email links |
| `GOOGLE_MAPS_API_KEY` | Optional — enables an interactive embedded map on the Dashboard |

> ⚠️ Never commit `.env` to version control. It is already in `.gitignore`.

### Getting a Gmail App Password
1. Enable **2-Step Verification** at [myaccount.google.com/security](https://myaccount.google.com/security)
2. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create an app password → copy the 16-character code → paste into `EMAIL_PASS`

### Getting Twilio Credentials
1. Sign up (free) at [twilio.com](https://www.twilio.com)
2. From the Console dashboard copy your **Account SID** and **Auth Token**
3. Get a free Twilio phone number → use it as `TWILIO_FROM_NUMBER`
> ⚠️ Free trial accounts can only send SMS to **verified** numbers. Upgrade to send to any number.

---

## 📡 API Endpoints

### Auth — `/api/auth` *(rate-limited: 20 req / 15 min per IP)*

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Create user (unverified) + send 6-digit OTP email |
| `POST` | `/verify-otp` | Public | Verify email OTP → mark verified → auto-login (set JWT cookie) |
| `POST` | `/resend-otp` | Public | Generate & send a new OTP (previous one expires) |
| `POST` | `/login` | Public | Authenticate (blocks unverified users) → set JWT cookie |
| `POST` | `/logout` | Public | Clear JWT cookie |
| `GET` | `/me` | 🔒 | Get current user's profile (id, name, email) |
| `POST` | `/forgot-password` | Public | Generate reset token + send email with reset link |
| `POST` | `/reset-password/:token` | Public | Validate token + set new password |

### Profile — `/api/profile` 🔒

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get current user's profile + avatar |
| `PUT` | `/` | Update name and email |
| `PUT` | `/password` | Change password (requires current password) |
| `POST` | `/avatar` | Upload profile picture (multipart/form-data) |
| `DELETE` | `/avatar` | Remove profile picture |

### Emergency Contacts — `/api/emergency-contacts` 🔒

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List all contacts for the current user |
| `POST` | `/` | Add a new emergency contact |
| `PUT` | `/:id` | Update contact by ID (owner-only) |
| `DELETE` | `/:id` | Delete contact by ID (owner-only) |

### Incidents — `/api/incidents` 🔒 *(SOS rate-limited: 20 alerts / hour per IP in production)*

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List all SOS incidents for the current user |
| `POST` | `/` | Log SOS incident + send email (nodemailer) & SMS (Twilio) alerts |

> 🔒 = Requires valid JWT in `httpOnly` cookie (set automatically on login/verify)

---

## 🎨 UI & Design System

| Token | Value |
|---|---|
| Primary accent | Cyan `#06b6d4` |
| Secondary accent | Violet `#8b5cf6` |
| Danger / SOS | Rose `#ef4444` |
| Register accent | Rose-Purple gradient `#fb7185 → #a855f7` |
| Neutrals | Slate scale |
| Heading font | [Sora](https://fonts.google.com/specimen/Sora) — weight 800/900 |
| Body font | System-ui / Segoe UI |
| Card style | Glassmorphic — `backdrop-filter: blur`, semi-transparent bg, subtle border |
| Dark mode | Class-based (`html.dark`) with full coverage |
| Responsive | Mobile-first CSS Grid breakpoints at 560px and 900px |
| CSS approach | Custom `main.css` + `loaders.css` design system + TailwindCSS utilities |

---

## ⏳ Loading States & UX

SafeHer implements a comprehensive loading system for premium user experience:

| Type | Where Used | Effect |
|---|---|---|
| **TopLoader** (progress bar) | Login, Register, Logout, Page navigation | YouTube-style cyan-to-purple gradient bar at top |
| **GlassLoader** (overlay) | Dashboard SOS sending | Frosted-glass overlay with animated shield + bouncing dots |
| **Skeleton Loading** | Contacts table, Profile page, Dashboard history, History cards | Shimmer animation matching page layout |
| **Button Spinners** | Login, Register, Contacts add/edit, Profile save, Password change | Inline Loader2 icon with disabled state |
| **SOS Pulse** | Dashboard SOS button | Pulsing box-shadow animation while sending |
| **OTP Timer** | Register Step 3 | 60-second resend cooldown with live countdown |
| **Code Splitting** | All page routes | React.lazy + Suspense for optimized initial load |

---

## 🎬 Animations

| Location | Effect |
|---|---|
| All modals | Spring scale-in / fade-out via Framer Motion `AnimatePresence` |
| Dashboard SOS | Triple pulse ring + hover lift + GlassLoader overlay |
| Contact table rows | Staggered slide-in (55 ms delay each) |
| Stats bar | Shimmer sweep + counter roll-up |
| History stats strip | Icon + value + label — distributed full width |
| Landing page | Framer Motion scroll-linked section reveals + anime.js text splits |
| About hero | Three floating colour orbs, shield bob animation |
| About stats | Animated roll-up counters on scroll |
| Register form | Animated step transitions (slide left/right) with step indicators |
| OTP input | Auto-focus progression + paste support |
| Buttons | Shimmer sweep + lift on hover + tap scale |
| Footer | Scroll-triggered fade-up with particle background |
| Avatar camera button | Scale-up on hover |
| Navbar avatar | Live update via custom `safeher:avatar-updated` event |
| Delete confirmation | Animated trash-can button with 3.2s animation |

---

## 🔐 Security

| Measure | Detail |
|---|---|
| Password hashing | **bcryptjs** — 10 salt rounds |
| Authentication | **JWT** — signed with `JWT_SECRET`, stored in `httpOnly` cookie (7-day expiry) |
| Cookie security | `httpOnly`, `secure` (prod), `sameSite: strict` (prod) / `lax` (dev) |
| OTP hashing | **SHA-256** — OTP codes are hashed before storing in database |
| OTP expiry | 10-minute time-to-live, auto-invalidated after verification |
| Email verification | Required before login — blocks unverified accounts |
| Protected routes | `authMiddleware.js` on all private API routes |
| Data scoping | All contacts and incidents are scoped to `req.user.id` |
| Security headers | **Helmet** — sets CSP, HSTS, X-Frame-Options, etc. |
| Auth rate limiting | **express-rate-limit** — 20 auth requests / 15 min per IP |
| SOS rate limiting | **express-rate-limit** — 20 SOS alerts / hour per IP (production only) |
| Input validation | `validators.js` — name required, email format, password ≥ 6 chars |
| Global error handler | `errorHandler.js` — returns JSON `{ msg }`, never exposes stack traces |
| React error boundary | `ErrorBoundary.js` — catches unexpected render failures with a friendly UI |
| Token storage | `httpOnly` cookie — JavaScript cannot access the JWT |
| Request auth | Cookie-based — `withCredentials: true` on Axios instance |

---

## 📝 Notes

- **Registration flow**: 3-step wizard — Profile → Password → Email OTP. Users must verify their email before they can log in. Unverified accounts can re-register (overwrites the previous attempt).
- **SOS flow**: pressing the SOS button calls the backend which dispatches **email** (nodemailer) and **SMS** (Twilio) alerts simultaneously. A glassmorphism loader overlay shows during the process. Both channels work from any browser or device.
- **Avatar storage**: images are stored as Base64 data URIs directly in MongoDB (`avatarBase64` field) so they work regardless of whether the static file server is available.
- **Email setup**: uses nodemailer with Gmail App Passwords for SOS alerts, OTP verification codes, and password reset links. For production, consider **SendGrid** or **AWS SES** for better deliverability and higher volume.
- **SMS setup**: uses Twilio's REST API. Free trial accounts can only send to verified numbers. Upgrade to a paid account to send to any number.
- **SOS rate limiter**: in `development` mode (`NODE_ENV=development`) the SOS rate limiter is disabled so you can test freely. It activates only in `production`.
- **MongoDB Atlas passwords**: if your password contains `@` or other special characters, URL-encode them before putting them in `MONGO_URI` (e.g. `@` → `%40`).
- The **SOS FAB** (floating action button) is globally available on every authenticated page — no navigation needed in an emergency.
- **Theme switching** (Light / Dark / System) is available in the footer and persists in `localStorage`.
- **Code splitting**: all page components are lazy-loaded via `React.lazy` + `Suspense` for faster initial bundle size.
- **Animation cleanup**: all anime.js `splitText` mutations and `requestAnimationFrame` loops are properly cleaned up on component unmount to prevent memory leaks and null-ref errors.

---

*SafeHer — Because every woman deserves to feel safe, everywhere, always.* 💜


## 👤 Author

**Jagannath** — [GitHub Profile](https://github.com/JagannathNayak01)

---
