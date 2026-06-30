import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, unauthorized, requireRole, serverError, badRequest } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { wargaCreateSchema, formatZodError, zodErrors } from '@/lib/validations';

// GET semua warga (dengan advanced filter & pagination)
//
// Parameter filter yang didukung:
//   search       : cari di nama_lengkap atau NIK
//   status       : status_tinggal (domisili_asli, non_ktp, sementara, non_domisili)
//   jenis_kelamin: 'Laki-laki' | 'Perempuan'
//   agama        : Islam, Kristen, Katolik, Hindu, Buddha, Konghucu
//   status_ekonomi: mampu, rentan_miskin, miskin
//   rt           : filter berdasarkan RT (via join KK)
//   rw           : filter berdasarkan RW (via join KK)
//   usia_min     : batas bawah usia (tahun)
//   usia_max     : batas atas usia (tahun)
//   page, limit  : pagination
export async function GET(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const jenisKelamin = searchParams.get('jenis_kelamin');
    const agama = searchParams.get('agama');
    const statusEkonomi = searchParams.get('status_ekonomi');
    const rt = searchParams.get('rt');
    const rw = searchParams.get('rw');
    const usiaMin = searchParams.get('usia_min');
    const usiaMax = searchParams.get('usia_max');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `
      SELECT w.*, kk.alamat, kk.rt, kk.rw, kk.dusun
      FROM warga w
      LEFT JOIN kepala_keluarga kk ON w.no_kk = kk.no_kk
      WHERE 1=1
    `;
    const params: any[] = [];
    let i = 1;

    if (search) {
      query += ` AND (w.nama_lengkap ILIKE $${i} OR w.nik ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }
    if (status) {
      query += ` AND w.status_tinggal = $${i}`;
      params.push(status);
      i++;
    }
    if (jenisKelamin) {
      query += ` AND w.jenis_kelamin = $${i}`;
      params.push(jenisKelamin);
      i++;
    }
    if (agama) {
      query += ` AND w.agama = $${i}`;
      params.push(agama);
      i++;
    }
    if (statusEkonomi) {
      query += ` AND w.status_ekonomi = $${i}`;
      params.push(statusEkonomi);
      i++;
    }
    if (rt) {
      query += ` AND kk.rt = $${i}`;
      params.push(rt);
      i++;
    }
    if (rw) {
      query += ` AND kk.rw = $${i}`;
      params.push(rw);
      i++;
    }
    if (usiaMin) {
      const minUsia = parseInt(usiaMin);
      if (!isNaN(minUsia)) {
        query += ` AND w.tanggal_lahir IS NOT NULL AND EXTRACT(YEAR FROM age(w.tanggal_lahir)) >= $${i}`;
        params.push(minUsia);
        i++;
      }
    }
    if (usiaMax) {
      const maxUsia = parseInt(usiaMax);
      if (!isNaN(maxUsia)) {
        query += ` AND w.tanggal_lahir IS NOT NULL AND EXTRACT(YEAR FROM age(w.tanggal_lahir)) <= $${i}`;
        params.push(maxUsia);
        i++;
      }
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM (${query}) t`, params);
    query += ` ORDER BY w.nama_lengkap LIMIT $${i} OFFSET $${i + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return Response.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      filter: {
        search: search || null,
        status: status || null,
        jenis_kelamin: jenisKelamin || null,
        agama: agama || null,
        status_ekonomi: statusEkonomi || null,
        rt: rt || null,
        rw: rw || null,
        usia_min: usiaMin || null,
        usia_max: usiaMax || null,
      },
    });
  } catch (err: any) {
    return serverError(err);
  }
}

// POST tambah warga
export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return unauthorized();

  // Hanya staff dan dukuh yang bisa tambah warga
  const roleCheck = requireRole(user, 'staff');
  if (roleCheck) return roleCheck;

  try {
    const body = await req.json();

    // Validasi input dengan Zod
    const parsed = wargaCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(formatZodError(parsed.error), zodErrors(parsed.error));
    }
    const d = parsed.data;

    // Validasi: NIK dan KK wajib ada
    if (!d.nik) {
      return badRequest('NIK wajib diisi');
    }
    const adaKkLama = !!d.no_kk;
    const adaKkBaru = !!d.no_kk_baru && !!d.no_kk_baru.no_kk;
    if (!adaKkLama && !adaKkBaru) {
      return badRequest('No. KK wajib diisi (pilih KK yang ada atau input KK baru)');
    }

    // Jika user memilih input KK baru, buat KK dulu
    let no_kk = d.no_kk || '';
    if (adaKkBaru && !no_kk) {
      try {
        await pool.query(
          `INSERT INTO kepala_keluarga (no_kk, nama_kepala)
           VALUES ($1, $2)
           ON CONFLICT (no_kk) DO NOTHING`,
          [d.no_kk_baru!.no_kk, d.no_kk_baru!.nama_kepala]
        );
        no_kk = d.no_kk_baru!.no_kk;
      } catch {
        return badRequest('Gagal membuat KK baru');
      }
    }

    const result = await pool.query(
      `INSERT INTO warga (nik, no_kk, nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin,
        agama, pendidikan, pekerjaan, status_perkawinan, status_hubungan, golongan_darah,
        telepon, email, status_tinggal, status_ekonomi, alamat_ktp, alamat_domisili)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [d.nik, no_kk, d.nama_lengkap, d.tempat_lahir, d.tanggal_lahir, d.jenis_kelamin,
        d.agama, d.pendidikan, d.pekerjaan, d.status_perkawinan, d.status_hubungan,
        d.golongan_darah, d.telepon, d.email, d.status_tinggal, d.status_ekonomi,
        d.alamat_ktp || null, d.alamat_domisili || null]
    );

    const created = result.rows[0];
    // Audit: create warga — fire-and-forget
    audit(req, user, {
      aksi: 'create',
      entitas: 'warga',
      entitas_id: created.id,
      deskripsi: `Tambah warga baru: ${created.nama_lengkap} (NIK: ${created.nik})`,
      nilai_baru: { nik: d.nik, nama_lengkap: d.nama_lengkap, no_kk, status_tinggal: d.status_tinggal },
    });

    return Response.json(created, { status: 201 });
  } catch (err: any) {
    if (err.code === '23505') return badRequest('NIK sudah terdaftar');
    return serverError(err);
  }
}
