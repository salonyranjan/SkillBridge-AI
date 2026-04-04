const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

// 🚀 CRITICAL: Trust Render's proxy to allow "Secure" cookies
app.set("trust proxy", 1); 

app.use(express.json())
app.use(cookieParser())

const allowedOrigins = [
    "https://skillbridge-ai-orpin.vercel.app", 
    "https://skillbridge-ai.vercel.app",
    "https://skill-bridge-ai.vercel.app",
    "http://localhost:5173"
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
            callback(null, true);
        } else {
            console.log("CORS blocked this origin:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

/* Rest of your routes */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

module.exports = app