import dotenv from "dotenv";
dotenv.config();

const config = {
  mongodb: {
    url: process.env.MONGODB_ATLAS || "mongodb://localhost:27017/taskflow",
    databaseName: "taskflow",
    options: {
    }
  },
  migrationsDir: "migrations",
  changelogCollectionName: "changelog",
  migrationFileExtension: ".js",
  useFileHash: false,
  moduleSystem: 'esm',
};

export default config;
