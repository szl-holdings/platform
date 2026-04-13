const path = require("path");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
module.exports = {
  schema: path.join(__dirname, "./src/schema/index.ts"),
  out: path.join(__dirname, "./drizzle"),
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
};
