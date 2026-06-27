import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log(`PostgreSQL Connected: ${client.host}`);
    client.release();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

export { pool, connectDB };
export default connectDB;
