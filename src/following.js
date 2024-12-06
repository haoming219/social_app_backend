const express = require("express");
const mongoose = require("mongoose");
const isLoggedIn = require("./auth").isLoggedIn; // Import the isLoggedIn middleware
const router = express.Router();
const { Profile } = require("./auth");

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

//stubs
router.get("/following/:user?", isLoggedIn, async (req, res) => {
    const username = req.params.user || req.user;

    try {
        // Find the user in the database by username
        const profile = await Profile.findOne({accountName: username});

        if (!profile) {
            return res.status(404).json({message: "User not found."});
        }

        // Return the user's headline, defaulting to "Happy" if no headline is set
        const friends = profile.followedUsers || "";

        res.status(200).json({
            username: profile.accountName,
            friends,
        });
    } catch (err) {
        console.error("Error fetching headline:", err);
        res.status(500).json({message: "Server error."});
    }
});

router.put("/following/:user?", isLoggedIn, async (req, res) => {
    const newfriend = req.params.user;


    try {
        // First, check if the user to be added exists in the database
        const friendProfile = await Profile.findOne({ accountName: newfriend });

        if (!friendProfile) {
            return res.status(404).json({ message: "User not exist." });
        }

        // Find the current user's profile
        const currentUserProfile = await Profile.findOneAndUpdate(
            { accountName: req.user }, // req.user comes from isLoggedIn middleware
            {
                $addToSet: { followedUsers: newfriend } // Use $addToSet to prevent duplicates
            },
            { new: true } // Return the updated document
        );

        // Respond with the updated followed users list
        res.status(200).json({
            username: currentUserProfile.accountName,
            followedUsers: currentUserProfile.followedUsers
        });

    } catch (err) {
        console.error("Error adding friend:", err);
        res.status(500).json({ message: "Server error." });
    }
});


router.delete("/:user?", isLoggedIn,async (req, res) => {
    const friendToRemove = req.params.user;
    try {
        const currentProfile = await Profile.findOne({ accountName: req.user });

        // Perform the update
        const updatedProfile = await Profile.findOneAndUpdate(
            {
                accountName: req.user,
                followedUsers: { $in: [friendToRemove] } // Ensure the friend is actually in the array
            },
            {
                $pull: { followedUsers: friendToRemove }
            },
            {
                new: true, // Return the updated document
                runValidators: true // Ensure validators run
            }
        );

        // Log the result of update

        if (!updatedProfile) {
            return res.status(404).json({
                message: "Friend not in followed users.",
                currentProfile: currentProfile ? currentProfile.followedUsers : null
            });
        }

        // Respond with the updated followed users list
        res.status(200).json({
            username: updatedProfile.accountName,
            followedUsers: updatedProfile.followedUsers
        });

    } catch (err) {
        console.error("Error removing friend:", err);
        res.status(500).json({
            message: "Server error.",
            error: err.message
        });
    }
});

module.exports = router;