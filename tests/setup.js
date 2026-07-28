import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

beforeAll(async () => {
  // Use a completely separate database for testing so we don't wipe out real data!
  const testDbUri = process.env.MONGODB_ATLAS.replace("/taskflow?", "/taskflow_test?");

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  await mongoose.connect(testDbUri);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    // ===> drop the test database entirely when done
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  }
});

afterEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  }
});
