const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

// ── REUSABLE COOKIE OPTIONS ──
const cookieOptions = {
    httpOnly: true,     // Protects against XSS
    secure: true,       // REQUIRED for cross-site (HTTPS)
    sameSite: "none",   // REQUIRED for cross-site (Vercel to Render)
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    path: "/"
};

async function registerUserController(req, res) {
    const { username, email, password } = req.body
    if (!username || !email || !password) {
        return res.status(400).json({ message: "Please provide username, email and password" })
    }

    const isUserAlreadyExists = await userModel.findOne({ $or: [{ username }, { email }] })
    if (isUserAlreadyExists) {
        return res.status(400).json({ message: "Account already exists" })
    }

    const hash = await bcrypt.hash(password, 10)
    const user = await userModel.create({ username, email, password: hash })

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    // Update: Added production cookie options
    res.cookie("token", token, cookieOptions);

    res.status(201).json({
        message: "User registered successfully",
        user: { id: user._id, username: user.username, email: user.email }
    })
}

async function loginUserController(req, res) {
    const { email, password } = req.body
    const user = await userModel.findOne({ email })

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: "Invalid email or password" })
    }

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    // Update: Added production cookie options
    res.cookie("token", token, cookieOptions);

    res.status(200).json({
        message: "User loggedIn successfully.",
        user: { id: user._id, username: user.username, email: user.email }
    })
}

async function logoutUserController(req, res) {
    const token = req.cookies.token
    if (token) {
        await tokenBlacklistModel.create({ token })
    }

    // Update: Use same cookie options to clear successfully
    res.clearCookie("token", cookieOptions);

    res.status(200).json({ message: "User logged out successfully" })
}

async function getMeController(req, res) {
    const user = await userModel.findById(req.user.id)
    res.status(200).json({
        message: "User details fetched successfully",
        user: { id: user._id, username: user.username, email: user.email }
    })
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}