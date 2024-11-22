const request = require("supertest");
const app = require("../index"); // Adjust path to your server file
const mongoose = require("mongoose");

// Mock Database Models
const { User } = require("./auth");
const { Profile } = require("./auth");

describe("POST /register", () => {
    beforeAll(async () => {
        // Connect to a test database
        const MONGO_TEST_URI = "mongodb+srv://yu2974201195:bYZ6g00JLt0lXzr2@cluster0.cx1db.mongodb.net/test";
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGO_TEST_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
        }
        const validPayload = {
            accountName: "testUser",
            displayName: "Test User",
            email: "test@example.com",
            phone: "123-456-7890",
            dob: "2000-01-01",
            zipcode: "12345",
            password: "123",
        };

        await request(app)
            .post("/register")
            .send(validPayload);
    });

    afterAll(async () => {
        // await mongoose.connection.dropDatabase();
        await User.deleteMany({ accountName: "testUser" });
        await Profile.deleteMany({ accountName: "testUser" });
        await User.deleteMany({ accountName: "testuser" });
        await Profile.deleteMany({ accountName: "testuser" });
        await mongoose.disconnect();

    });


    it("should register a new user successfully", async () => {
        const validPayload = {
            accountName: "testuser",
            displayName: "Test User",
            email: "test@rice.com",
            phone: "123-456-7890",
            dob: "2000-01-01",
            zipcode: "12345",
            password: "123",
        };

        const response = await request(app)
            .post("/register")
            .send(validPayload);

        expect(response.status).toBe(201);
        expect(response.body).toEqual({ username: "testuser", result: "success" });

        // Verify that the user was saved in the database
        const user = await User.findOne({ accountName: "testuser" });
        const profile = await Profile.findOne({ accountName: "testuser" });

        expect(user).toBeTruthy();
        expect(profile).toBeTruthy();
        expect(profile.displayName).toBe("Test User");
    });

    it("should fail if the phone number is invalid", async () => {
        const invalidPayload = {
            accountName: "testUser",
            displayName: "Test User",
            email: "test@example.com",
            phone: "12345", // Invalid phone format
            dob: "2000-01-01",
            zipcode: "12345",
            password: "password123",
        };

        const response = await request(app)
            .post("/register")
            .send(invalidPayload);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Invalid phone number. Use format XXX-XXX-XXXX." });
    });

    it("should fail if the user is under 18", async () => {
        const invalidPayload = {
            accountName: "testUser",
            displayName: "Test User",
            email: "test@example.com",
            phone: "123-456-7890",
            dob: "2010-01-01", // Underage
            zipcode: "12345",
            password: "password123",
        };

        const response = await request(app)
            .post("/register")
            .send(invalidPayload);

        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "You must be at least 18 years old to register." });
    });

    it("should login a user successfully (POST /login)", async () => {
        const response = await request(app)
            .post("/login")
            .send({ accountName: "testUser", password: "123" })
            // .expect(200);

        expect(response.body.result).toBe("success");
        expect(response.body.username).toBe("testUser");
        // You may check for session or token, depending on your implementation
    });

    it("should fail login if credentials are wrong (POST /login)", async () => {
        const response = await request(app)
            .post("/login")
            .send({ accountName: "testUser", password: "wrongpassword" })
            .expect(401);

        expect(response.body.message).toBe("Invalid password.");
    });


    it("should fail to logout if not logged in (PUT /logout)", async () => {
        const response = await request(app)
            .put("/logout")
            .expect(401);

        expect(response.body.message).toBe("User not logged in or session expired.");
    });
});
