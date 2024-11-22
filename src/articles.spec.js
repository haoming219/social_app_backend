const request = require("supertest");
const express = require("express");
const app = require("../index"); // Adjust path to your server file
const mongoose = require("mongoose");
// Mock Database Models
const { User,isLoggedIn } = require("./auth");
const { Profile } = require("./auth");
const { router: articleRoutes, Article } = require("./articles");

describe("Article Routes", () => {
    let app;

    // Setup the app and mock the middleware before each test
    beforeEach(() => {
        app = express();
        app.use(express.json());

        // Manually mock the 'isLoggedIn' middleware to simulate an authenticated user
        app.use("/articles", (req, res, next) => {
            req.user = "testUser";  // Simulate the authenticated user
            next();  // Proceed to the next middleware (i.e., articleRoutes)
        });

        app.use("/articles", articleRoutes); // Use the real route handler
    });

    it("should not fetch articles when a valid user is logged in", async () => {
        // Use supertest to make a request
        const response = await request(app).get('/articles/articles');

        // Verify response status and body (update these checks based on your logic)
        expect(response.status).toBe(401);
        // expect(response.body).toBeInstanceOf(Array);
    });

    it("should not create a new article", async () => {
        const payload = {
            text: "This is a test article",
        };

        const response = await request(app).post('/articles/article').send(payload);

        expect(response.status).toBe(401);
        // expect(response.body).toBeTruthy(); // Check the body as per your response format
    });
});

