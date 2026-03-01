# 💬 Lumio — Real-Time Chat Application (MERN Stack)

![image alt](https://github.com/developer-badhan/Lumio/blob/3faf486f940f202f00fefdbab4498e8aa873d918/frontend/public/logo.png)

Lumio is a **modern, full-stack real-time chat application** inspired by WhatsApp, built using the **MERN Stack**.
It includes advanced messaging, AI-powered interactions, calling features, secure authentication, and media sharing.

---

## 🚀 Features Overview

### 🔐 Authentication & Security

* User Registration
* Email OTP Verification
* Secure Login (JWT stored in HTTP-only cookies)
* Logout
* Welcome Email after Registration
* Protected Routes with Middleware

### 👤 User Management

* Fetch All Registered Users
* Profile Picture Upload
* Online / Offline Status Indicator

### 💬 Messaging System

* One-to-One Chat
* Group Chat
* AI Chat (Direct 1-1 AI Interaction)
* AI Participation in Group Chat (`@ai explain this`)
* Edit Messages
* Read / Unread Message Tracking
* Message Notifications
* Image Upload
* Audio Upload
* Voice Messages

### ☁ Media Storage

* Images stored securely in Cloudinary
* Audio files stored in Cloudinary

### 📞 Calling Features

* One-to-One Calling
* Group Calling
* Real-time communication (Socket.io)

### 🧠 AI Integration

* Direct conversation with AI
* Mention AI inside group chats
* Context-aware smart responses

---

# 🏗 Tech Stack

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* HTTP-only Cookies
* Nodemailer (OTP & Welcome Emails)
* Cloudinary (Media Storage)
* Socket.io (Real-Time Features)

## Frontend

* React.js
* Tailwind CSS
* Context API
* Custom Hooks
* Axios
* Socket.io Client

---

# 📂 Project Structure

## 📦 Backend

```
backend/
│
└── src/
    ├── config/        # Database & service configurations
    ├── controllers/   # Business logic
    ├── models/        # Mongoose schemas
    ├── routers/       # API routes
    ├── middleware/    # Auth & custom middleware
    ├── utils/         # Utility functions
    ├── services/      # External services logic
    └── server.js      # Entry point
```

---

## 💻 Frontend

```
frontend/
│
└── src/
    ├── components/    # Reusable UI components
    ├── pages/         # Page-level components
    ├── context/       # Global state management
    ├── hooks/         # Custom React hooks
    ├── services/      # API calls
    ├── utils/         # Utility helpers
    └── App.jsx        # Root component
```

---

# 🔐 Environment Variables

Create a `.env` file inside the **backend root folder**.

### Example `.env`

```env
# Server
PORT=3000

# Database
MONGODB_URL=your-database-url

# Token secrete
ACCESS_TOKEN=your-access-token
REFRESH_TOKEN=your-refresh-token
VERIFY_TOKEN=your-verify-token

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration (Gmail Example)
EMAIL_HOST=your-email-host
EMAIL_PORT=your-email-port
EMAIL_USE_TLS=your-email-use-tls
EMAIL_HOST_USER=your-email-host-user
EMAIL_HOST_PASSWORD=your-email-host-password

```


---

# 🛠 Installation & Setup

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/developer-badhan/lumio.git
cd lumio
```

---

## 2️⃣ Backend Setup

```bash
cd backend
npm install
npm run dev
```

Server will start on:

```
http://localhost:3000
```

---

## 3️⃣ Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on:

```
http://localhost:5173
```

---

# 🔄 Development Workflow

1. Complete Backend APIs
2. Test APIs using Postman
3. Integrate Frontend with Backend
4. Build UI Components
5. Add Real-Time Features (Socket.io)

---

# 🧪 Testing

* ✅ API Testing using Postman
* ✅ Manual Media Upload Testing
* ✅ JWT Cookie Validation
* ✅ Email OTP Verification Testing
* ✅ Real-Time Messaging Testing

---


# 👨‍💻 Developer

Built using **MERN Stack architecture** with:

* Scalable folder structure
* Clean code principles
* Modular design pattern
* Secure authentication flow

---

# 📄 License

## MIT License

This project is licensed under the **MIT License**.

You are free to:

* ✅ Use
* ✅ Modify
* ✅ Distribute
* ✅ Use for commercial purposes

As long as you include the original license and copyright notice.

---

# ⭐ Support

If you like this project:

* Give it a ⭐ on GitHub
* Fork it

---

### 💡 Lumio — Connect. Chat. Collaborate.
