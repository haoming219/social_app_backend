const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const moment = require("moment");
// const md5 = require('md5');
const crypto = require("crypto");
const router = express.Router();
const app = express();
const cors = require('cors');
const axios = require('axios');
const cookieParser = require("cookie-parser");

app.use(cors({
    origin: '*', // Allow only your frontend
    credentials: true, // Allow cookies and other credentials
}));
app.use(cookieParser());


axios.defaults.withCredentials = true;

const sessionMap = new Map();
const cookieKey = 'sid';

// Define the User schema directly in auth.js
const userSchema = new mongoose.Schema({
    accountName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    salt: { type: String, required: true }
});

const profileSchema = new mongoose.Schema({
    accountName: { type: String, required: true },
    displayName: { type: String},
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    dob: { type: String, required: true },
    zipcode: { type: String, required: true },
    statusMessage: { type: String, default: "Hey, I am using RiceBook!" },
    followedUsers: { type: [String], default: [] },
    picture: { type: String, default: "" }, // No picture initially
});

const User = mongoose.model("User", userSchema,'users');
const Profile = mongoose.model("Profile", profileSchema,'profiles');

// Utility functions for validation
const isValidPhone = (phone) => /^\d{3}-\d{3}-\d{4}$/.test(phone); // US standard phone: XXX-XXX-XXXX
const isValidZipcode = (zipcode) => /^\d{5}(-\d{4})?$/.test(zipcode); // US ZIP code: 5 digits or 5+4
const isValidDOB = (dob) => {
    const age = moment().diff(moment(dob, "YYYY-MM-DD"), "years");
    return age >= 18; // Age must be at least 18
};

// Register Endpoint with Validation
router.post("/register", async (req, res) => {
    const { accountName, displayName, email, phone, dob, picture, zipcode, password } = req.body;

    try {
        // Backend validation
        if (!isValidPhone(phone)) {
            return res.status(401).json({ message: "Invalid phone number. Use format XXX-XXX-XXXX." });
        }
        if (!isValidZipcode(zipcode)) {
            return res.status(401).json({ message: "Invalid ZIP code. Use 5-digit or 5+4 format." });
        }
        if (!isValidDOB(dob)) {
            return res.status(401).json({ message: "You must be at least 18 years old to register." });
        }
        const exist = await User.findOne({ accountName: accountName });
        if (exist) {
            return res.status(401).json({ message: "Account Name Already Exist." });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const newUser = new User({
            accountName,
            password: hashedPassword, // Save the hashed password
            salt: salt,  // Save the salt (if needed for future password verification)
        });
        await newUser.save();

        // Create a new profile document
        const newProfile = new Profile({
            accountName,
            displayName,
            email,
            phone,
            dob,
            zipcode,
            picture,
            statusMessage: "Hey, I am using RiceBook!", // Default status message
            followedUsers: [], // Empty list of followed users
             // No profile picture initially
        });

        // Save the user in the database
        //
        await newProfile.save();

        const sessionKey = crypto.randomBytes(16).toString("hex");
        sessionMap.set(sessionKey, accountName);

        // Enhanced cookie setting
        res.cookie('sessionKey', sessionKey, {
            maxAge: 3600 * 1000,
            httpOnly: true,
            sameSite: 'Lax', // Crucial for cross-site
            secure: false, // Use secure in production
            path: '/', // Ensure cookie is available app-wide
            // domain: 'localhost' // Specify domain
        });

        // // Detailed logging
        // console.log('Session Key Set:', sessionKey);
        // console.log('Set-Cookie Header:', res.get('Set-Cookie'));
        res.status(201).json({ username: accountName, result: "success" });
    } catch (err) {
        console.error("Registration error:", err);
        if (err.code === 11000) {
            res.status(400).json({ message: "Email or account name already exists." });
        } else {
            res.status(500).json({ message: "Server error." });
        }
    }
});



// Login Endpoint
router.post("/login", async (req, res) => {
    const { accountName, password } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ accountName });
        if (!user) {
            return res.status(401).json({ message: "Invalid username." });
        }

        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password." });
        }

        const sessionKey = crypto.randomBytes(16).toString("hex");
        sessionMap.set(sessionKey, accountName);

        // Enhanced cookie setting
        res.cookie('sessionKey', sessionKey, {
            maxAge: 3600 * 1000,
            httpOnly: true,
            sameSite: 'Lax', // Crucial for cross-site
            secure: false, // Use secure in production
            path: '/', // Ensure cookie is available app-wide
            // domain: 'localhost' // Specify domain
        });

        // Detailed logging
        console.log('Session Key Set:', sessionKey);
        console.log('Set-Cookie Header:', res.get('Set-Cookie'));

        res.status(200).json({
            username: accountName,
            result: "success"
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error." });
    }
});

function isLoggedIn(req, res, next) {
    const rawCookies = req.headers.cookie;
    const cookieObj = {};
    if (rawCookies) {
        rawCookies.split(';').forEach(cookie => {
            const [name, value] = cookie.trim().split('=');
            cookieObj[name.trim()] = value;
        });
    }
    const sessionKey =
        req.cookies?.sessionKey ||
        cookieObj['sessionKey'];
    if (!sessionKey || !sessionMap.has(sessionKey)) {
        return res.status(401).json({
            message: "Unauthorized",
            receivedCookies: req.cookies,
            sessionMapKeys: Array.from(sessionMap.keys())
        });
    }
    //
    // req.user = sessionMap.get(sessionKey);
    const user = sessionMap.get(sessionKey);
    req.user = user;
    req.sessionKey = sessionKey;
    next();
}

// Logout endpoint
router.put("/logout", (req, res) => {
    console.log("Cookies:", req.cookies);
    const sessionKey = req.cookies?.sessionKey; // Access 'sessionKey' from cookies
    console.log("Session Key from Cookie:", sessionKey);

    // Check if sessionKey exists in sessionMap
    if (!sessionKey || !sessionMap.has(sessionKey)) {
        console.log("Session Map Contents:", sessionMap);
        return res.status(401).json({ message: "User not logged in or session expired." });
    }

    // Step 1: Remove sessionKey from the session map
    sessionMap.delete(sessionKey);
    console.log("Session Map After Deletion:", sessionMap);

    // Step 2: Clear the session cookie
    res.clearCookie("sessionKey", {
        httpOnly: true,
        sameSite: "None",
        secure: true,
    });

    // Step 3: Send a success response
    res.status(200).json({ message: "Logout successful." });

});

router.put('/password', isLoggedIn, async (req, res) => {
    try {
        // Ensure user is logged in (assuming you have authentication middleware)
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { password: newPassword } = req.body;
        const username = req.user;

        // Find the user
        const user = await User.findOne({ accountName: username });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate new salt and hash
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        const passwordLength = newPassword.length;

        // Update user's password and salt
        user.password = hashedPassword;
        user.salt = salt;

        // Save the updated user
        await user.save();

        // Respond with success
        res.json({
            username: username,
            length: passwordLength,
            result: 'success'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ message: 'Error changing password' });
    }
});


module.exports = { router, isLoggedIn, User, Profile };
