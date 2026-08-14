import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import asyncHandler from "../utils/asyncHandler.js";

const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Name, email and password are required"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters"
        });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
        email: normalizedEmail
    });

    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: "Email is already registered"
        });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword
    });

    const token = generateToken(user._id);

    res.status(201).json({
        success: true,
        message: "Registration successful",
        data: {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        }
    });
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
        email: normalizedEmail
    }).select("+password");

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    if (!user.isActive) {
        return res.status(403).json({
            success: false,
            message: "Account is inactive"
        });
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    const token = generateToken(user._id);

    res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        }
    });
});

const getMe = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        }
    });
});

export {
    register,
    login,
    getMe
};