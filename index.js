const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { router: authRoutes, isLoggedIn } = require("./src/auth");
const { router: articleRoutes, Article } = require("./src/articles");
const profileRoutes = require("./src/profile");
const followingRoutes = require("./src/following");

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware



app.use(cors({
    origin: 'https://social-web-ricebook.surge.sh', // Exact frontend origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(bodyParser.json());
// MongoDB Connection
const MONGO_URI = "mongodb+srv://yu2974201195:bYZ6g00JLt0lXzr2@cluster0.cx1db.mongodb.net/ricebook"
;
if (mongoose.connection.readyState === 0) {
    mongoose
        .connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => {
            console.log("Connected to MongoDB");
        })
        .catch((err) => {
            console.error("Failed to connect to MongoDB:", err);
        });
}


// Routes
app.use("", authRoutes);
app.use("/articles", isLoggedIn, articleRoutes);
app.use("/profile", isLoggedIn, profileRoutes);
app.use("/following",isLoggedIn,followingRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
