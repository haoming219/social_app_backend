const express = require("express");
const mongoose = require("mongoose");
const isLoggedIn = require("./auth").isLoggedIn; // Import the isLoggedIn middleware
const router = express.Router();

//stubs
router.get("/following/:user?", (req, res) => {
    const { user } = req.params;

    if (user) {
        res.json({
            username: user,
            following: ["user1", "user2", "user3"], // Stubbed following list
        });
    } else {
        res.status(400).json({ message: "Username parameter is required." });
    }
});

router.put("/following/:user", (req, res) => {
    const { user } = req.params;

    if (!user) {
        return res.status(400).json({ message: "Username parameter is required." });
    }

    res.json({
        username: "loggedInUser", // Replace with actual logged-in username
        following: ["user1", "user2", user], // Stubbed updated following list
    });
});

router.delete("/following/:user", (req, res) => {
    const { user } = req.params;

    if (!user) {
        return res.status(400).json({ message: "Username parameter is required." });
    }

    res.json({
        username: "loggedInUser", // Replace with actual logged-in username
        following: ["user1", "user2"], // Stubbed updated following list after removal
    });
});

module.exports = router;