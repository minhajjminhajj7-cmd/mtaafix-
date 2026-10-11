const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER
});

pool.on("connect", () => {
  console.log("Connected to MtaaFix PostgreSQL database");
});

pool.on("error", (error) => {
  console.error("PostgreSQL connection error:", error);
});

module.exports = pool;
