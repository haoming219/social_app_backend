const express = require("express");
const { Profile } = require("./auth"); // Assuming User model is already set up
const router = express.Router();
// Assuming that isLoggedIn is already imported from auth.js
const { isLoggedIn } = require("./auth");

// Endpoint to get a user's headline
router.get("/headline/:user?", isLoggedIn, async (req, res) => {
    // Get the username from the route params, or use the logged-in user if no user param is provided
    const username = req.params.user || req.user;

    try {
        // Find the user in the database by username
        const profile = await Profile.findOne({ accountName: username });

        if (!profile) {
            return res.status(404).json({ message: "User not found." });
        }

        // Return the user's headline, defaulting to "Happy" if no headline is set
        const headline = profile.statusMessage || "Default Headline";

        res.status(200).json({
            username: profile.accountName,
            headline: headline,
        });
    } catch (err) {
        console.error("Error fetching headline:", err);
        res.status(500).json({ message: "Server error." });
    }
});

router.put("/headline", isLoggedIn, async (req, res) => {
    const { headline } = req.body;

    // Validate input
    if (!headline) {
        return res.status(400).json({ message: "Headline is required." });
    }

    try {
        // Update the headline in the profiles collection
        const updatedProfile = await Profile.findOneAndUpdate(
            { accountName: req.user }, // req.user comes from isLoggedIn middleware
            { $set: { statusMessage: headline } },// Update the headline field
            { new: true } // Return the updated document
        );

        if (!updatedProfile) {
            return res.status(404).json({ message: "User profile not found." });
        }

        // Respond with the updated headline
        res.status(200).json({ username: updatedProfile.accountName, headline: updatedProfile.statusMessage });
    } catch (err) {
        console.error("Error updating headline:", err);
        res.status(500).json({ message: "Server error." });
    }
});

//stubs
router.get("/email/:user?", (req, res) => {
    const { user } = req.params;

    // Simulated response for stub
    if (user) {
        res.json({
            username: user,
            email: `${user}@example.com`, // Stubbed email address
        });
    } else {
        res.status(400).json({ message: "Username parameter is required." });
    }
});

router.put("/email", (req, res) => {
    const { email } = req.body;

    // Check for the new email in the request body
    if (!email) {
        return res.status(400).json({ message: "New email address is required." });
    }

    // Simulated response for stub
    res.json({
        username: "loggedInUser", // Replace with actual logged-in username
        email, // Return the new email address
    });
});

router.get("/zipcode/:user?", (req, res) => {
    const { user } = req.params;

    if (user) {
        res.json({
            username: user,
            zipcode: "12345", // Stubbed ZIP code
        });
    } else {
        res.status(400).json({ message: "Username parameter is required." });
    }
});

router.put("/zipcode", (req, res) => {
    const { zipcode } = req.body;

    if (!zipcode) {
        return res.status(400).json({ message: "New ZIP code is required." });
    }

    res.json({
        username: "loggedInUser", // Replace with actual logged-in username
        zipcode, // Return the updated ZIP code
    });
});

router.get("/dob/:user?", (req, res) => {
    const { user } = req.params;

    if (user) {
        res.json({
            username: user,
            dob: new Date().getTime(), // Stubbed date of birth in milliseconds
        });
    } else {
        res.status(400).json({ message: "Username parameter is required." });
    }
});

router.get("/avatar/:user?", (req, res) => {
    const { user } = req.params;

    if (user) {
        res.json({
            username: user,
            avatar: "https://example.com/avatar.jpg", // Stubbed avatar URL
        });
    } else {
        res.status(400).json({ message: "Username parameter is required." });
    }
});

router.put("/avatar", (req, res) => {
    const { avatar } = req.body;

    if (!avatar) {
        return res.status(400).json({ message: "New avatar URL is required." });
    }

    res.json({
        username: "loggedInUser", // Replace with actual logged-in username
        avatar, // Return the updated avatar URL
    });
});

router.get("/phone/:user?", (req, res) => {
    const { user } = req.params;

    if (user) {
        res.json({
            username: user,
            phone: "123-456-7890", // Stubbed phone number
        });
    } else {
        res.status(400).json({ message: "Username parameter is required." });
    }
});

router.put("/phone", (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: "New phone number is required." });
    }

    res.json({
        username: "loggedInUser", // Replace with actual logged-in username
        phone, // Return the updated phone number
    });
});


module.exports = router;
