const express = require("express");
const mongoose = require("mongoose");
const isLoggedIn = require("./auth").isLoggedIn; // Import the isLoggedIn middleware
const router = express.Router();

// Article schema definition
const articleSchema = new mongoose.Schema({
    pid: { type: Number, required: true, unique: true },
    author: { type: String, required: true },
    text: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    comments: { type: Array, default: [] },
});

const Article = mongoose.model("Article", articleSchema);

// Counter for generating unique pids (in-memory, consider using a more robust approach for production)
let pidCounter = 1;

// GET /articles - Fetch all articles
// GET /articles or GET /articles/:id
router.get("/articles/:id?", isLoggedIn, async (req, res) => {
    const { id } = req.params;

    try {
        if (id) {
            // If an article ID is provided
            const article = await Article.findOne({ pid: id });
            if (!article) {
                return res.status(404).json({ message: "Article not found." });
            }
            return res.status(200).json(article);
        } else {
            // If no ID is provided, fetch all articles for the logged-in user
            const articles = await Article.find({ author: req.user });
            res.status(200).json(articles);
        }
    } catch (err) {
        console.error("Error fetching articles:", err);
        res.status(500).json({ message: "Server error." });
    }
});


// POST /article - Create a new article
// POST /article
router.post("/article", isLoggedIn, async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ message: "Article text is required." });
    }

    try {
        // Fetch the latest article by the logged-in user and get its pid
        const lastArticle = await Article.findOne({ author: req.user })
            .sort({ pid: -1 }) // Sort by pid in descending order to get the latest
            .exec();

        const newPid = lastArticle ? lastArticle.pid + 1 : 1; // If no articles, start with pid = 1

        // Create the new article
        const newArticle = new Article({
            pid: newPid,
            author: req.user, // Author from isLoggedIn middleware
            text,
            date: new Date(), // Current timestamp
        });

        // Save the article in the database
        await newArticle.save();
        const articles = await Article.find({ author: req.user });
        res.status(200).json(articles);
    } catch (err) {
        console.error("Error creating article:", err);
        res.status(500).json({ message: "Server error." });
    }
});

//stub
router.put("/articles/:id", (req, res) => {
    const { id } = req.params;
    const { text, commentId } = req.body;

    if (!text) {
        return res.status(400).json({ message: "Text is required." });
    }

    res.json({
        articles: [
            {
                id, // Replace with actual article ID
                author: "loggedInUser", // Replace with actual logged-in username
                text, // New article or comment text
                comments: commentId
                    ? [{ commentId, text }] // Stubbed updated comment
                    : [], // No comments in this case
            },
        ],
    });
});


module.exports = {router,Article};
