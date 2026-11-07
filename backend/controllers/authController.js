const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

// POST /api/auth/register
async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a name, valid email, and password of at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = generateToken(user._id.toString());

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to register. Please try again.",
    });
  }
}

// POST /api/auth/login
async function loginUser(req, res) {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id.toString());

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again.",
    });
  }
}

async function getMe(req, res) {
    return res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  }

  module.exports = {
    registerUser,
    loginUser,
    getMe,
  };