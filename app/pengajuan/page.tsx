'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Input, Select, Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { badgeSurat } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  FileText,
  ShieldCheck,
  Search,
  Send,
  CheckCircle2,
  ArrowLeft,
  UserCheck,
} from 'lucide-react';

const JENIS_SURAT = [
  'Surat Keterangan Domisili',
  'Surat Keterangan Tidak Mampu',
  'Surat Keterangan Usaha',
  'Surat Keterangan Kelahiran',
  'Surat Keterangan Kematian',
  'Surat Izin Keramaian',
  'Surat Pengantar',
  'Surat Pemberitahuan',
];

interface WargaInfo {
  nik: string;
  nama: string;
}

interface RiwayatSurat {
  nomor_surat: string;
  jenis_surat: string;
  keperluan: string;
  status: string;
  catatan?: string;
  tanggal_pengajuan: string;
  tanggal_selesai?: string;
}

interface HasilPengajuan {
  nomor_surat: string;
  status: string;
  tanggal: string;
}

export default function PengajuanPage() {
  const [tab, setTab] = useState<'ajukan' | 'riwayat'>('ajukan');

  // Form pengajuan
  const [nik, setNik] = useState('');
  const [warga, setWarga] = useState<WargaInfo | null>(null);
  const [cekLoading, setCekLoading] = useState(false);
  const [jenisSurat, setJenisSurat] = useState('');
  const [keperluan, setKeperluan] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [hasil, setHasil] = useState<HasilPengajuan | null>(null);

  // Riwayat
  const [nikRiwayat, setNikRiwayat] = useState('');
  const [riwayatLoading, setRiwayatLoading] = useState(false);
  const [riwayat, setRiwayat] = useState<{ nama: string; list: RiwayatSurat[] } | null>(null);

  const cekNIK = async () => {
    if (!/^\d{16}$/.test(nik)) {
      toast.error('NIK harus 16 digit angka');
      return;
    }
    setCekLoading(true);
    setWarga(null);
    try {
      const res = await apiFetch<{ valid: boolean; nama?: string; pesan: string }>(
        '/api/warga/cek-nik',
        { method: 'POST', body: JSON.stringify({ nik }) }
      );
      if (res.valid && res.nama) {
        setWarga({ nik, nama: res.nama });
        toast.success(`Selamat datang, ${res.nama}`);
      } else {
        toast.error(res.pesan);
      }
    } catch (err: any) {
      toast.error(err?.error || 'Gagal memverifikasi NIK');
    } finally {
      setCekLoading(false);
    }
  };

  const kirimPengajuan = async () => {
    if (!warga) {
      toast.error('Verifikasi NIK terlebih dahulu');
      return;
    }
    if (!jenisSurat) {
      toast.error('Pilih jenis surat terlebih dahulu');
      return;
    }
    if (keperluan.trim().length < 5) {
      toast.error('Keperluan minimal 5 karakter');
      return;
    }
    setSubmitLoading(true);
    try {
      const res = await apiFetch<{
        sukses: boolean;
        pesan: string;
        data?: HasilPengajuan;
      }>('/api/surat/pengajuan', {
        method: 'POST',
        body: JSON.stringify({ nik: warga.nik, jenis_surat: jenisSurat, keperluan }),
      });
      if (res.sukses && res.data) {
        setHasil(res.data);
        toast.success('Pengajuan berhasil dikirim!');
      } else {
        toast.error(res.pesan);
      }
    } catch (err: any) {
      toast.error(err?.error || 'Gagal mengirim pengajuan');
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setHasil(null);
    setJenisSurat('');
    setKeperluan('');
  };

  const cekRiwayat = async () => {
    if (!/^\d{16}$/.test(nikRiwayat)) {
      toast.error('NIK harus 16 digit angka');
      return;
    }
    setRiwayatLoading(true);
    setRiwayat(null);
    try {
      const res = await apiFetch<{ nama?: string; riwayat?: RiwayatSurat[]; pesan?: string }>(
        `/api/surat/pengajuan?nik=${nikRiwayat}`
      );
      if (res.nama && res.riwayat) {
        setRiwayat({ nama: res.nama, list: res.riwayat });
      } else {
        toast.error(res.pesan || 'NIK tidak ditemukan');
      }
    } catch (err: any) {
      toast.error(err?.error || 'Gagal memuat riwayat');
    } finally {
      setRiwayatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-hijau-pekat via-hijau to-hijau-muda">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                Padukuhan Majegan
              </h1>
              <p className="text-white/70 text-xs">Layanan Pengajuan Surat Online</p>
            </div>
          </div>
          <a
            href="/"
            className="text-white/80 hover:text-white text-sm flex items-center gap-1 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs px-3 py-1 rounded-full mb-4">
          <ShieldCheck className="w-3.5 h-3.5" />
          Layanan Resmi Padukuhan
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Ajukan Surat dengan Mudah
        </h2>
        <p className="text-white/80 max-w-xl mx-auto">
          Layanan online untuk warga Padukuhan Majegan. Verifikasi NIK Anda, pilih jenis surat,
          dan kirim pengajuan tanpa perlu datang ke kantor dukuh.
        </p>
      </section>

      {/* Tabs + Panel */}
      <main className="max-w-3xl mx-auto px-4 pb-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Tab buttons */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setTab('ajukan')}
              className={`flex-1 px-4 py-4 text-sm font-semibold transition ${
                tab === 'ajukan'
                  ? 'text-hijau border-b-2 border-hijau bg-hijau-terang/10'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              📝 Ajukan Surat
            </button>
            <button
              onClick={() => setTab('riwayat')}
              className={`flex-1 px-4 py-4 text-sm font-semibold transition ${
                tab === 'riwayat'
                  ? 'text-hijau border-b-2 border-hijau bg-hijau-terang/10'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              🔍 Cek Status
            </button>
          </div>

          <div className="p-6 md:p-8">
            {/* TAB: AJUKAN SURAT */}
            {tab === 'ajukan' && (
              <>
                {/* Hasil sukses */}
                {hasil ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-hijau-terang/20 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-9 h-9 text-hijau" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                      Pengajuan Berhasil!
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                      Simpan nomor surat Anda untuk melacak status
                    </p>
                    <div className="inline-block bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-3 mb-5">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Nomor Surat</p>
                      <p className="text-lg font-bold text-hijau font-mono">{hasil.nomor_surat}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Status:{' '}
                        <span className="font-semibold capitalize text-kuning">{hasil.status}</span>
                      </p>
                    </div>
                    <div>
                      <Button onClick={resetForm} variant="hijau">
                        ➕ Ajukan Surat Lain
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Step 1: Verifikasi NIK */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        1. Verifikasi NIK
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={nik}
                          onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                          placeholder="Masukkan 16 digit NIK"
                          maxLength={16}
                          className="flex-1"
                        />
                        <Button onClick={cekNIK} loading={cekLoading} variant="biru">
                          <Search className="w-4 h-4" />
                          Verifikasi
                        </Button>
                      </div>
                      {warga && (
                        <div className="mt-3 flex items-center gap-3 bg-hijau-terang/10 border border-hijau-terang/30 rounded-lg p-3">
                          <div className="w-10 h-10 rounded-full bg-hijau text-white flex items-center justify-center font-bold">
                            {warga.nama.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800 dark:text-gray-100">
                              {warga.nama}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-hijau" />
                              NIK terverifikasi
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Form pengajuan (hanya muncul setelah NIK verified) */}
                    {warga && (
                      <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 pt-2">
                          2. Detail Pengajuan
                        </label>
                        <Select
                          label="Jenis Surat"
                          value={jenisSurat}
                          onChange={(e) => setJenisSurat(e.target.value)}
                          options={JENIS_SURAT.map((j) => ({ value: j, label: j }))}
                          placeholder="— Pilih jenis surat —"
                        />
                        <Textarea
                          label="Keperluan"
                          value={keperluan}
                          onChange={(e) => setKeperluan(e.target.value)}
                          placeholder="Jelaskan keperluan pengajuan surat ini secara singkat dan jelas..."
                          rows={3}
                        />
                        <Button
                          onClick={kirimPengajuan}
                          loading={submitLoading}
                          variant="hijau"
                          size="lg"
                          className="w-full"
                        >
                          <Send className="w-4 h-4" />
                          Kirim Pengajuan
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* TAB: CEK STATUS */}
            {tab === 'riwayat' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Masukkan NIK Anda
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={nikRiwayat}
                      onChange={(e) =>
                        setNikRiwayat(e.target.value.replace(/\D/g, '').slice(0, 16))
                      }
                      placeholder="16 digit NIK"
                      maxLength={16}
                      className="flex-1"
                    />
                    <Button onClick={cekRiwayat} loading={riwayatLoading} variant="biru">
                      <Search className="w-4 h-4" />
                      Lihat Status
                    </Button>
                  </div>
                </div>

                {riwayat && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-bold text-gray-800 dark:text-gray-100">
                        Riwayat Surat
                      </h3>
                      <span className="text-sm text-hijau font-semibold">{riwayat.nama}</span>
                    </div>

                    {riwayat.list.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-sm">
                        Belum ada riwayat pengajuan surat.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {riwayat.list.map((s, i) => (
                          <div
                            key={i}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-sm transition"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                                  {s.jenis_surat}
                                </p>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">
                                  {s.nomor_surat}
                                </p>
                              </div>
                              <Badge variant={badgeSurat(s.status).variant}>
                                {badgeSurat(s.status).label}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                              {s.keperluan}
                            </p>
                            <div className="text-xs text-gray-400 flex items-center gap-3">
                              <span>Diajukan: {formatDateTime(s.tanggal_pengajuan)}</span>
                              {s.tanggal_selesai && (
                                <span>Selesai: {formatDateTime(s.tanggal_selesai)}</span>
                              )}
                            </div>
                            {s.catatan && (
                              <div className="mt-2 text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 p-2 rounded">
                                📝 {s.catatan}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-white/60 text-xs mt-6">
          © {new Date().getFullYear()} Padukuhan Majegan · Sistem Administrasi Online
        </p>
      </main>
    </div>
  );
}
