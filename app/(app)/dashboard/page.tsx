'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import { Card, CardHeader } from '@/components/ui/Card';
import Badge, { badgeSurat } from '@/components/ui/Badge';
import EmptyState, { LoadingState } from '@/components/ui/EmptyState';
import { formatTanggal, formatDateTime } from '@/lib/utils';
import { Users, FileText, Clock, Home, Megaphone, ChevronRight, Download } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface StatistikWarga {
  total_warga: number;
  laki_laki: number;
  perempuan: number;
  jumlah_kk: number;
  agama: { agama: string; jumlah: number }[];
  pekerjaan: { pekerjaan: string; jumlah: number }[];
  ekonomi: { status_ekonomi: string; jumlah: number }[];
  kelompok_usia: { kelompok_usia: string; laki_laki: number; perempuan: number }[];
}

interface StatistikSurat {
  total: number;
  pending: number;
  diproses: number;
  selesai: number;
  ditolak: number;
}

interface Surat {
  id: string;
  nomor_surat: string;
  jenis_surat: string;
  pemohon_nama: string;
  status: string;
  created_at: string;
}

interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  penting: boolean;
  kategori: string;
  created_at: string;
}

// Warna chart — sesuai tema
const CHART_COLORS = ['#1a6b3c', '#2d9657', '#4aba7a', '#f5a623', '#e63946', '#1d6fa4', '#8b5cf6', '#64748b'];

const EKONOMI_LABELS: Record<string, string> = {
  mampu: 'Mampu',
  rentan_miskin: 'Rentan Miskin',
  miskin: 'Miskin',
};

const EKONOMI_COLORS: Record<string, string> = {
  mampu: '#1a6b3c',
  rentan_miskin: '#f5a623',
  miskin: '#e63946',
};

export default function DashboardPage() {
  const [statWarga, setStatWarga] = useState<StatistikWarga | null>(null);
  const [statSurat, setStatSurat] = useState<StatistikSurat | null>(null);
  const [suratTerbaru, setSuratTerbaru] = useState<Surat[]>([]);
  const [pengumuman, setPengumuman] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<StatistikWarga>('/api/warga/statistik'),
      apiFetch<StatistikSurat>('/api/surat/statistik'),
      apiFetch<{ data: Surat[] }>('/api/surat?limit=5'),
      apiFetch<Pengumuman[]>('/api/pengumuman'),
    ])
      .then(([w, s, surat, peng]) => {
        setStatWarga(w);
        setStatSurat(s);
        setSuratTerbaru(surat.data || []);
        setPengumuman(peng.slice(0, 3));
      })
      .catch(() => {
        // Error sudah dihandle apiFetch (auto-logout kalau 401)
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState text="Memuat dashboard..." />;

  // Prepare chart data
  const agamaData = (statWarga?.agama || []).map((a, i) => ({
    name: a.agama || 'Tidak diisi',
    value: a.jumlah,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const pekerjaanData = (statWarga?.pekerjaan || []).map((p) => ({
    name: p.pekerjaan.length > 15 ? p.pekerjaan.slice(0, 15) + '…' : p.pekerjaan,
    fullName: p.pekerjaan,
    jumlah: p.jumlah,
  }));

  const ekonomiData = (statWarga?.ekonomi || []).map((e) => ({
    name: EKONOMI_LABELS[e.status_ekonomi] || e.status_ekonomi,
    value: e.jumlah,
    color: EKONOMI_COLORS[e.status_ekonomi] || '#64748b',
  }));

  // Kelompok usia per jenis kelamin — ditampilkan berdampingan (grouped bar)
  const usiaData = (statWarga?.kelompok_usia || []).map((u) => ({
    kelompok: u.kelompok_usia,
    laki_laki: u.laki_laki,
    perempuan: u.perempuan,
  }));

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Warga"
          value={statWarga?.total_warga ?? 0}
          icon={<Users size={24} />}
          color="hijau"
          hint={`${statWarga?.laki_laki ?? 0} L / ${statWarga?.perempuan ?? 0} P`}
        />
        <StatCard
          title="Kepala Keluarga"
          value={statWarga?.jumlah_kk ?? 0}
          icon={<Home size={24} />}
          color="biru"
        />
        <StatCard
          title="Surat Bulan Ini"
          value={statSurat?.total ?? 0}
          icon={<FileText size={24} />}
          color="kuning"
        />
        <StatCard
          title="Surat Pending"
          value={statSurat?.pending ?? 0}
          icon={<Clock size={24} />}
          color="merah"
          hint="Perlu ditindaklanjuti"
        />
      </div>

      {/* Two column: recent letters + announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Letters */}
        <Card className="lg:col-span-2" padding="md">
          <CardHeader
            title="Surat Terbaru"
            subtitle="5 pengajuan surat terakhir"
            icon={<FileText size={20} />}
            action={
              <Link
                href="/surat"
                className="inline-flex items-center gap-1 text-sm font-medium text-hijau hover:text-hijau-muda"
              >
                Lihat semua <ChevronRight size={16} />
              </Link>
            }
          />
          {suratTerbaru.length === 0 ? (
            <EmptyState title="Belum ada surat" description="Surat yang diajukan akan muncul di sini" />
          ) : (
            <div className="space-y-2">
              {suratTerbaru.map((s) => {
                const b = badgeSurat(s.status);
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text)] truncate">
                        {s.pemohon_nama}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {s.jenis_surat} · {s.nomor_surat}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={b.variant}>{b.label}</Badge>
                      <span className="text-xs text-[var(--text-muted)]">
                        {formatTanggal(s.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Announcements */}
        <Card padding="md">
          <CardHeader
            title="Pengumuman"
            subtitle="Terbaru"
            icon={<Megaphone size={20} />}
            action={
              <Link
                href="/pengumuman"
                className="inline-flex items-center gap-1 text-sm font-medium text-hijau hover:text-hijau-muda"
              >
                Semua <ChevronRight size={16} />
              </Link>
            }
          />
          {pengumuman.length === 0 ? (
            <EmptyState title="Belum ada pengumuman" />
          ) : (
            <div className="space-y-3">
              {pengumuman.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-lg border-l-4 px-4 py-3 ${
                    p.penting
                      ? 'border-merah bg-merah/5'
                      : 'border-hijau bg-hijau/5'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {p.penting && <Badge variant="merah">Penting</Badge>}
                    <p className="text-sm font-medium text-[var(--text)] line-clamp-1">{p.judul}</p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">{p.isi}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{formatDateTime(p.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Charts Section — recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart: Agama */}
        {agamaData.length > 0 && (
          <Card padding="md">
            <CardHeader title="Distribusi Agama" icon={<Users size={20} />} />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={agamaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={{ strokeWidth: 1 }}
                    fontSize={12}
                  >
                    {agamaData.map((entry, index) => (
                      <Cell key={`agama-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Bar Chart: Pekerjaan */}
        {pekerjaanData.length > 0 && (
          <Card padding="md">
            <CardHeader title="Top Pekerjaan" icon={<Users size={20} />} />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pekerjaanData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, _name: any, props: any) => [value, props.payload?.fullName || props.payload?.name || '']}
                  />
                  <Bar dataKey="jumlah" fill="#1a6b3c" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Pie Chart: Status Ekonomi */}
        {ekonomiData.length > 0 && (
          <Card padding="md">
            <CardHeader title="Status Ekonomi" icon={<Users size={20} />} />
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ekonomiData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{ strokeWidth: 1 }}
                    fontSize={12}
                  >
                    {ekonomiData.map((entry, index) => (
                      <Cell key={`ekonomi-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      {/* Piramida Penduduk: Kelompok Usia x Jenis Kelamin */}
      {usiaData.length > 0 && (
        <Card padding="md">
          <CardHeader title="Kelompok Usia" icon={<Users size={20} />} />
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={usiaData}
                margin={{ left: 0, right: 20, bottom: 10 }}
              >
                <XAxis dataKey="kelompok" type="category" tick={{ fontSize: 11 }} />
                <YAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: any, name: any) => [value, name]}
                />
                <Legend
                  formatter={(value) => (value === 'laki_laki' ? 'Laki-laki' : 'Perempuan')}
                />
                <Bar dataKey="laki_laki" name="laki_laki" fill="#1d6fa4" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="perempuan" name="perempuan" fill="#e63946" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
