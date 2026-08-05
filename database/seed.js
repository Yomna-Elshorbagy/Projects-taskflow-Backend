import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.model.js";
import Project from "./models/project.model.js";
import Task from "./models/task.model.js";
import Token from "./models/token.model.js";
import { roles, status, gender, taskStatus } from "../utils/constant/enums.js";
import { hashedPass } from "../utils/hash-compare.js";

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    // 1. Environment Guard (Senior Best Practice)
    if (process.env.NODE_ENV === "production") {
      console.error("🚨 CRITICAL: Cannot run seed script in production environment!");
      process.exit(1);
    }

    // Check command line arguments for a --wipe flag
    const wipeData = process.argv.includes("--wipe");

    // 2. Connect to DB
    const dbUrl = process.env.MONGODB_ATLAS || "mongodb://localhost:27017/taskflow";
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB for seeding...");

    // 3. Clear existing data ONLY if --wipe flag is provided
    if (wipeData) {
      console.log("🧹 --wipe flag detected. Clearing existing collections...");
      await User.deleteMany({});
      await Project.deleteMany({});
      await Task.deleteMany({});
      await Token.deleteMany({});
    } else {
      console.log("🔄 Running in idempotent mode (no --wipe). Existing data will be preserved or updated.");
    }

    // 4. Create or Update Admin User (Idempotency)
    const adminPassword = hashedPass({ password: "AdminPassword123!", saltRounds: Number(process.env.SALT_ROUNDS) || 8 });
    const adminUser = await User.findOneAndUpdate(
      { email: "admin@example.com" }, // Query
      {
        $setOnInsert: { userName: "Admin User", gender: gender.MALE }, // Only set on creation
        $set: { 
          password: adminPassword, 
          role: roles.ADMIN, 
          isVerified: true, 
          status: status.VERIFIED,
          mobileNumber: "01000000001"
        } // Always update password and role to ensure admin access
      }, 
      { new: true, upsert: true } // Options
    );
    console.log(`-> Admin user ${wipeData ? 'created' : 'upserted'}. (admin@example.com / AdminPassword123!)`);

    // 5. Create or Update Regular User (Idempotency)
    const userPassword = hashedPass({ password: "UserPassword123!", saltRounds: Number(process.env.SALT_ROUNDS) || 8 });
    const regularUser = await User.findOneAndUpdate(
      { email: "user@example.com" },
      {
        $setOnInsert: { userName: "Regular User", gender: gender.FEMALE },
        $set: { 
          password: userPassword, 
          role: roles.MEMBER, 
          isVerified: true, 
          status: status.VERIFIED,
          mobileNumber: "01000000002"
        }
      },
      { new: true, upsert: true }
    );
    console.log(`-> Regular user ${wipeData ? 'created' : 'upserted'}. (user@example.com / UserPassword123!)`);

    // 6. Upsert a Project
    const project = await Project.findOneAndUpdate(
      { name: "Seed Project Alpha" },
      {
        $setOnInsert: { description: "This is a strictly over 20 characters description for the seed project." },
        $set: { creator: adminUser._id },
        $addToSet: { members: regularUser._id } // Prevents duplicating the member if ran multiple times
      },
      { new: true, upsert: true }
    );
    console.log(`-> Project ${wipeData ? 'created' : 'upserted'}.`);

    // 7. Upsert a Task
    const task = await Task.findOneAndUpdate(
      { title: "Initial Setup Task", project: project._id },
      {
        $setOnInsert: { description: "This is a strictly over 20 characters description for the initial task.", creator: adminUser._id },
        $set: {
          assignee: regularUser._id,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
          status: taskStatus.TODO,
        }
      },
      { new: true, upsert: true }
    );
    console.log(`-> Task ${wipeData ? 'created' : 'upserted'}.`);

    console.log("\n==================================");
    console.log("Database seeding completed successfully!");
    console.log("==================================\n");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
