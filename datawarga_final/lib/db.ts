import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase memerlukan SSL di production
  ssl: {
    rejectUnauthorized: false,
  },
});

// Logging error (opsional tapi sangat membantu)
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
});

export default pool;