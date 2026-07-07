import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase memerlukan SSL di production
  ssl: {
    rejectUnauthorized: false,
  },
  // Jangan tunggu terlalu lama kalau koneksi ke Supabase bermasalah
  // (network/DNS flaky) — biar error cepat kelihatan, bukan hang 20-30 detik
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 30000,
  max: 10,
});

// Logging error (opsional tapi sangat membantu)
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
});

export default pool;