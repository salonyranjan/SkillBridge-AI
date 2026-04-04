# 🚀 SkillBridge AI

SkillBridge AI is a full-stack, AI-powered career coaching platform designed to generate personalized interview strategies. By analyzing a user's self-description, target job description, and uploaded resume, the platform leverages Generative AI to provide targeted, actionable insights to help candidates ace their interviews.

## ✨ Features

* **🤖 AI-Powered Interview Strategies:** Integrates with Google's Gemini 2.5 Flash model to generate comprehensive, context-aware interview preparation reports.
* **🔐 Secure Authentication:** Robust user authentication using JWTs, bcrypt password hashing, and secure, cross-site HTTP-only cookies.
* **📄 Resume Parsing:** Seamless resume upload and processing to contextually match candidate skills with job requirements.
* **🌐 Cross-Domain Architecture:** Fully separated frontend and backend environments configured for secure cross-origin resource sharing (CORS).
* **📱 Responsive UI:** Modern, accessible user interface built with React and Radix UI components.

## 🛠️ Tech Stack

**Frontend:**
* React (Vite)
* Tailwind CSS / Shadcn UI
* Axios (with cross-site credentials)
* Deployed on **Vercel**

**Backend:**
* Node.js & Express.js
* MongoDB Atlas (Mongoose)
* Google Generative AI SDK (Gemini API)
* JSON Web Tokens (JWT) & Cookie Parser
* Deployed on **Render**

---

## 🚦 Local Development Setup

Follow these steps to get the project running on your local machine.

### Prerequisites
* Node.js (v18+ recommended)
* MongoDB Atlas account (or local MongoDB instance)
* Google Gemini API Key

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/skillbridge-ai.git](https://github.com/yourusername/skillbridge-ai.git)
cd skillbridge-ai
```

### 2. Backend Setup
```bash
cd backend
npm install
```
## Create a .env file in the backend directory:
```Code snippet
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
GOOGLE_GENAI_API_KEY=your_gemini_api_key
```
## Start the backend development server:
```bash
npm run dev
```
### 3. Frontend Setup
Open a new terminal window/tab:

```bash
cd frontend
npm install
```
## Create a .env file in the frontend directory:

```Code snippet
VITE_API_BASE_URL=http://localhost:3000
```
## Start the Vite development server:
```bash
npm run dev
```
## 🌍 Production Deployment
This project uses a separated deployment strategy.

### 1.Backend (Render): * Deployed as a Web Service.

Express is configured with app.set("trust proxy", 1) to handle secure cookies behind Render's proxy.

CORS is configured to strictly allow the Vercel frontend domains.

### 2.Frontend (Vercel): * Deployed via Vercel GitHub integration.

Environment variable VITE_API_BASE_URL points to the live Render backend URL.

**Important Production Variables:**
Ensure backend cookies are set with secure: true and sameSite: "none" for cross-domain authentication to work.
