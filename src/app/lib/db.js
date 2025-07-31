import mysql from "mysql2/promise"

// Database configuration
const dbConfig = {
  host: "db5015836914.hosting-data.io",
  user: "dbu3106096",
  password: "HlF4M1rUzhqT1BiMD5dZ1vmw",
  database: "dbs12912227",
  charset: "utf8",
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
}

// Create connection pool
const pool = mysql.createPool(dbConfig)

export default pool

// Helper function for single queries
export async function executeQuery() {
  try {
    const [results] = await pool.execute(query, params)
    return results
  } catch (error) {
    console.error("Query execution error:", error)
    throw error
  }
}
