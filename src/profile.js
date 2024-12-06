const express = require("express");
const { Profile } = require("./auth"); // Assuming User model is already set up
const router = express.Router();
// Assuming that isLoggedIn is already imported from auth.js
const { isLoggedIn } = require("./auth");

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
router.get("/email/:user?", isLoggedIn, async (req, res) => {
    const username = req.params.user || req.user;

    try {
        // Find the user in the database by username
        const profile = await Profile.findOne({accountName: username});

        if (!profile) {
            return res.status(404).json({message: "User not found."});
        }

        // Return the user's headline, defaulting to "Happy" if no headline is set
        const email = profile.email;

        res.status(200).json({
            username: profile.accountName,
            email:email,
        });
    } catch (err) {
        console.error("Error fetching email:", err);
        res.status(500).json({message: "Server error."});
    }
});

router.put("/email", isLoggedIn, async (req, res) => {
    const {email} = req.body;

    // Validate input
    if (!email) {
        return res.status(400).json({message: "Email is required."});
    }

    try {
        // Update the headline in the profiles collection
        const updatedProfile = await Profile.findOneAndUpdate(
            {accountName: req.user}, // req.user comes from isLoggedIn middleware
            {$set: {email:email}},// Update the headline field
            {new: true} // Return the updated document
        );

        if (!updatedProfile) {
            return res.status(404).json({message: "User profile not found."});
        }

        // Respond with the updated headline
        res.status(200).json({username: updatedProfile.accountName, email: updatedProfile.email});
    } catch (err) {
        console.error("Error updating email:", err);
        res.status(500).json({message: "Server error."});
    }
});

router.get("/zipcode/:user?", isLoggedIn,async (req, res) => {
    const username = req.params.user || req.user;

    try {
        // Find the user in the database by username
        const profile = await Profile.findOne({accountName: username});

        if (!profile) {
            return res.status(404).json({message: "User not found."});
        }

        // Return the user's headline, defaulting to "Happy" if no headline is set
        const zipcode = profile.zipcode;

        res.status(200).json({
            username: profile.accountName,
            zipcode:zipcode,
        });
    } catch (err) {
        console.error("Error fetching email:", err);
        res.status(500).json({message: "Server error."});
    }
});

router.put("/zipcode", isLoggedIn, async (req, res) => {
    const {zipcode} = req.body;

    // Validate input
    if (!zipcode) {
        return res.status(400).json({message: "Headline is required."});
    }

    try {
        // Update the headline in the profiles collection
        const updatedProfile = await Profile.findOneAndUpdate(
            {accountName: req.user}, // req.user comes from isLoggedIn middleware
            {$set: {zipcode: zipcode}},// Update the headline field
            {new: true} // Return the updated document
        );

        if (!updatedProfile) {
            return res.status(404).json({message: "User profile not found."});
        }

        // Respond with the updated headline
        res.status(200).json({username: updatedProfile.accountName, zipcode: updatedProfile.zipcode});
    } catch (err) {
        console.error("Error updating zipcode:", err);
        res.status(500).json({message: "Server error."});
    }
});

router.get("/dob/:user?", isLoggedIn, async (req, res) => {
    const username = req.params.user || req.user;

    try {
        // Find the user in the database by username
        const profile = await Profile.findOne({accountName: username});

        if (!profile) {
            return res.status(404).json({message: "User not found."});
        }

        // Return the user's headline, defaulting to "Happy" if no headline is set
        const dob = profile.dob;

        res.status(200).json({
            username: profile.accountName,
            dob:dob,
        });
    } catch (err) {
        console.error("Error fetching email:", err);
        res.status(500).json({message: "Server error."});
    }
});

router.get("/avatar/:user?", isLoggedIn, async (req, res) => {
    const username = req.params.user || req.user;

    try {
        // Find the user in the database by username
        const profile = await Profile.findOne({accountName: username});

        if (!profile) {
            return res.status(404).json({message: "User not found."});
        }

        // Return the user's headline, defaulting to "Happy" if no headline is set
        const url = profile.picture;

        res.status(200).json({
            username: profile.accountName,
            url: url,
        });
    } catch (err) {
        console.error("Error fetching avatar:", err);
        res.status(500).json({message: "Server error."});
    }
});

router.put("/avatar", isLoggedIn, async (req, res) => {
    const {url} = req.body;

    // Validate input
    if (!url) {
        return res.status(400).json({message: "Image path is required."});
    }

    try {
        // Update the headline in the profiles collection
        const updatedProfile = await Profile.findOneAndUpdate(
            {accountName: req.user}, // req.user comes from isLoggedIn middleware
            {$set: {picture: url}},// Update the headline field
            {new: true} // Return the updated document
        );

        if (!updatedProfile) {
            return res.status(404).json({message: "User profile not found."});
        }

        // Respond with the updated headline
        res.status(200).json({username: updatedProfile.accountName, url: updatedProfile.url});
    } catch (err) {
        console.error("Error updating phone:", err);
        res.status(500).json({message: "Server error."});
    }
});

router.get("/phone/:user?", isLoggedIn, async (req, res) => {
    const username = req.params.user || req.user;

    try {
        // Find the user in the database by username
        const profile = await Profile.findOne({accountName: username});

        if (!profile) {
            return res.status(404).json({message: "User not found."});
        }

        // Return the user's headline, defaulting to "Happy" if no headline is set
        const phone = profile.phone;

        res.status(200).json({
            username: profile.accountName,
            phone:phone,
        });
    } catch (err) {
        console.error("Error fetching email:", err);
        res.status(500).json({message: "Server error."});
    }
});

router.put("/phone", isLoggedIn, async (req, res) => {
    const {phone} = req.body;

    // Validate input
    if (!phone) {
        return res.status(400).json({message: "Phone is required."});
    }

    try {
        // Update the headline in the profiles collection
        const updatedProfile = await Profile.findOneAndUpdate(
            {accountName: req.user}, // req.user comes from isLoggedIn middleware
            {$set: {phone: phone}},// Update the headline field
            {new: true} // Return the updated document
        );

        if (!updatedProfile) {
            return res.status(404).json({message: "User profile not found."});
        }

        // Respond with the updated headline
        res.status(200).json({username: updatedProfile.accountName, phone: updatedProfile.phone});
    } catch (err) {
        console.error("Error updating phone:", err);
        res.status(500).json({message: "Server error."});
    }
});


module.exports = router;
