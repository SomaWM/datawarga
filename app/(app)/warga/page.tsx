'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import SearchBar from '@/components/ui/SearchBar';
import Button from '@/components/ui/Button';
import Badge, { badgeEkonomi } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState, { LoadingState } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Input';
import { formatTanggal, hitungUmur, debounce } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  UserPlus,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface Warga {
  id: string;
  no_kk?: string;
  nik: string;
  nama_lengkap: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  agama: string;
  pekerjaan: string;
  status_perkawinan: string;
  status_hubungan: string;
  golongan_darah: string;
  telepon: string;
  email: string;
  status_tinggal: string;
  status_ekonomi: string | null;
  pendidikan?: string;
  alamat_ktp?: string;
  alamat_domisili?: string;
  alamat?: string;
  rt?: string;
  rw?: string;
}

interface KK {
  id: string;
  no_kk: string;
  nama_kepala: string;
  alamat: string;
  rt: string;
  rw: string;
  dusun: string;
  telepon: string;
  jumlah_anggota: number;
}

const AGAMA_OPTIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const HUBUNGAN_OPTIONS = ['Kepala Keluarga', 'Istri', 'Anak', 'Famili Lain', 'Pembantu'];

export default function WargaPage() {
  const [listKK, setListKK] = useState<KK[]>([]);
  const [allWarga, setAllWarga] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedKK, setExpandedKK] = useState<Set<string>>(new Set());

  // Modal state
  const [modalWarga, setModalWarga] = useState<Warga | 'new' | null>(null);
  const [modalKKEdit, setModalKKEdit] = useState<KK | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Warga | KK | null>(null);
  const [deleteType, setDeleteType] = useState<'warga' | 'kk'>('warga');
  const [saving, setSaving] = useState(false);
  const [modalImport, setModalImport] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [kk, warga] = await Promise.all([
        apiFetch<KK[]>('/api/kk'),
        apiFetch<{ data: Warga[] }>('/api/warga?limit=9999'),
      ]);
      setListKK(kk);
      setAllWarga(warga.data || []);
    } catch {
      // handled by apiFetch
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter warga by search
  const filteredWarga = allWarga.filter((w) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      w.nama_lengkap?.toLowerCase().includes(q) ||
      w.nik?.includes(q)
    );
  });

  // Group warga by no_kk
  const kkWithWarga = listKK
    .map((kk) => ({
      ...kk,
      anggota: filteredWarga.filter((w) => {
        // warga punya field no_kk? data warga dari join tidak bawa no_kk,
        // tapi kita group pakai no_kk dari kk list -> ambil dari allWarga
        return true; // akan di-filter lebih detail di bawah
      }),
    }))
    // Filter KK yang cocok search juga
    .filter((kk) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return kk.nama_kepala?.toLowerCase().includes(q) || kk.no_kk?.includes(q);
    });

  const toggleKK = (id: string) => {
    setExpandedKK((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={debounce(setSearch, 300)}
          placeholder="Cari nama warga atau NIK..."
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button
            variant="biru"
            onClick={() => setModalImport(true)}
          >
            <Upload size={18} /> Import Excel
          </Button>
          <Button
            variant="abu"
            onClick={() => {
              const token = localStorage.getItem('token_majegan');
              // Open export endpoint in new tab (download via browser)
              const url = `/api/warga/export?search=${encodeURIComponent(search || '')}`;
              // Use fetch with token header for auth, create blob download
              fetch(url, { headers: { Authorization: `Bearer ${token}` } })
                .then((res) => res.blob())
                .then((blob) => {
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `data-warga-${new Date().toISOString().slice(0, 10)}.xlsx`;
                  a.click();
                  URL.revokeObjectURL(a.href);
                  toast.success('Export berhasil diunduh');
                })
                .catch(() => toast.error('Gagal export data'));
            }}
          >
            <Download size={18} /> Export Excel
          </Button>
          <Button onClick={() => setModalWarga('new')} className="whitespace-nowrap" variant="hijau">
            <Plus size={18} /> Tambah Warga
          </Button>
        </div>
      </div>

      {/* List KK accordion */}
      {loading ? (
        <LoadingState text="Memuat data warga..." />
      ) : kkWithWarga.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada data warga"
            description="Tambahkan kepala keluarga pertama untuk memulai."
            icon={<Users size={28} />}
            action={
              <Button onClick={() => setModalWarga('new')}>
                <Plus size={18} /> Tambah Warga
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {kkWithWarga.map((kk) => {
            const anggotaKK = allWarga.filter(
              (w) => (w as any).no_kk === kk.no_kk
            );
            const isOpen = expandedKK.has(kk.id);
            return (
              <Card key={kk.id} padding="none" className="overflow-hidden">
                {/* KK Header */}
                <button
                  onClick={() => toggleKK(kk.id)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isOpen ? (
                      <ChevronDown size={20} className="text-[var(--text-muted)] flex-shrink-0" />
                    ) : (
                      <ChevronRight size={20} className="text-[var(--text-muted)] flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--text)] truncate">
                        {kk.nama_kepala}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        No. KK: {kk.no_kk} · {kk.rt ? `RT ${kk.rt}/${kk.rw}` : ''} ·{' '}
                        {kk.alamat}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="biru">{anggotaKK.length} anggota</Badge>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(kk);
                        setDeleteType('kk');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          setDeleteTarget(kk);
                          setDeleteType('kk');
                        }
                      }}
                      className="rounded-lg p-1.5 text-merah hover:bg-merah/10 transition"
                      title="Hapus KK"
                    >
                      <Trash2 size={16} />
                    </span>
                  </div>
                </button>

                {/* Members */}
                {isOpen && (
                  <div className="border-t border-[var(--border)]">
                    {anggotaKK.length === 0 ? (
                      <p className="px-5 py-4 text-sm text-[var(--text-muted)]">
                        Belum ada anggota keluarga terdaftar.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-800/50 text-[var(--text-muted)]">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium">Nama</th>
                              <th className="px-4 py-2 text-left font-medium">NIK</th>
                              <th className="px-4 py-2 text-left font-medium">L/P</th>
                              <th className="px-4 py-2 text-left font-medium">Umur</th>
                              <th className="px-4 py-2 text-left font-medium">Hubungan</th>
                              <th className="px-4 py-2 text-left font-medium">Ekonomi</th>
                              <th className="px-4 py-2 text-right font-medium">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border)]">
                            {anggotaKK.map((w) => {
                              const umur = hitungUmur(w.tanggal_lahir);
                              const ek = badgeEkonomi(w.status_ekonomi);
                              return (
                                <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                  <td className="px-4 py-2.5 font-medium text-[var(--text)]">
                                    {w.nama_lengkap}
                                  </td>
                                  <td className="px-4 py-2.5 text-[var(--text-muted)] font-mono text-xs">
                                    {w.nik}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    {w.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}
                                  </td>
                                  <td className="px-4 py-2.5 text-[var(--text-muted)]">
                                    {umur !== null ? `${umur} th` : '-'}
                                  </td>
                                  <td className="px-4 py-2.5 text-[var(--text-muted)]">
                                    {w.status_hubungan || '-'}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <Badge variant={ek.variant}>{ek.label}</Badge>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="flex justify-end gap-1">
                                      <button
                                        onClick={() => setModalWarga(w)}
                                        className="rounded-lg p-1.5 text-biru hover:bg-biru/10 transition"
                                        title="Edit warga"
                                      >
                                        <Pencil size={16} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setDeleteTarget(w);
                                          setDeleteType('warga');
                                        }}
                                        className="rounded-lg p-1.5 text-merah hover:bg-merah/10 transition"
                                        title="Hapus warga"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="border-t border-[var(--border)] px-4 py-2.5">
                      <button
                        onClick={() => setModalWarga('new')}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-hijau hover:text-hijau-muda"
                      >
                        <UserPlus size={16} /> Tambah anggota
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* TODO: Modal Form Warga - akan diisi pada iterasi berikutnya */}
      <WargaModal
        data={modalWarga}
        onClose={() => setModalWarga(null)}
        onSaved={() => {
          setModalWarga(null);
          loadData();
        }}
        listKK={listKK}
      />

      <ImportModal
        open={modalImport}
        onClose={() => setModalImport(false)}
        onSaved={() => {
          setModalImport(false);
          loadData();
        }}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={deleteType === 'warga' ? 'Hapus Data Warga' : 'Hapus Kartu Keluarga'}
        message={
          deleteType === 'warga'
            ? `Yakin ingin menghapus data warga "${(deleteTarget as Warga)?.nama_lengkap}"? Tindakan ini tidak bisa dibatalkan.`
            : `Yakin ingin menghapus KK "${(deleteTarget as KK)?.nama_kepala}"? Seluruh ${
                allWarga.filter((w) => (w as any).no_kk === (deleteTarget as KK)?.no_kk).length
              } anggota warga dalam KK ini juga akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.`
        }
        loading={saving}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setSaving(true);
          try {
            const endpoint =
              deleteType === 'warga'
                ? `/api/warga/${(deleteTarget as Warga).id}`
                : `/api/kk/${(deleteTarget as KK).id}`;
            await apiFetch(endpoint, { method: 'DELETE' });
            toast.success('Data berhasil dihapus');
            setDeleteTarget(null);
            loadData();
          } catch (err: any) {
            toast.error(err?.error || 'Gagal menghapus data');
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}

// ── Warga Modal Form ─────────────────────────────────────────────
function WargaModal({
  data,
  onClose,
  onSaved,
  listKK,
}: {
  data: Warga | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
  listKK: KK[];
}) {
  const isNew = data === 'new';
  const editing = isNew ? null : data;
  const [form, setForm] = useState<Partial<Warga>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [kkMode, setKkMode] = useState<'pilih' | 'baru'>('pilih');
  const [noKkBaru, setNoKkBaru] = useState('');
  const [namaKepalaBaru, setNamaKepalaBaru] = useState('');

  useEffect(() => {
    if (editing) {
      setForm(editing);
    } else if (isNew) {
      setForm({
        jenis_kelamin: 'Laki-laki',
        agama: 'Islam',
        status_hubungan: 'Kepala Keluarga',
        status_tinggal: 'domisili_asli',
        status_ekonomi: 'mampu',
      });
      setKkMode('pilih');
      setNoKkBaru('');
      setNamaKepalaBaru('');
    }
  }, [editing, isNew]);

  if (!data) return null;

  const handleSubmit = async () => {
    setError('');
    if (!form.nama_lengkap) {
      setError('Nama lengkap wajib diisi');
      return;
    }
    if (!form.nik) {
      setError('NIK wajib diisi');
      return;
    }
    if (!/^\d{16}$/.test(form.nik)) {
      setError('NIK harus 16 digit angka');
      return;
    }
    if (isNew && !form.no_kk && kkMode === 'pilih') {
      setError('No. KK wajib dipilih');
      return;
    }
    if (isNew && kkMode === 'baru' && !noKkBaru) {
      setError('No. KK baru wajib diisi');
      return;
    }
    if (isNew && kkMode === 'baru' && !namaKepalaBaru) {
      setError('Nama kepala keluarga wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/warga/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        toast.success('Data warga berhasil diperbarui');
      } else {
        const payload: Record<string, any> = { ...form };
        if (kkMode === 'baru') {
          payload.no_kk = undefined; // jangan kirim no_kk lama
          payload.no_kk_baru = { no_kk: noKkBaru, nama_kepala: namaKepalaBaru };
        } else {
          payload.no_kk_baru = undefined;
        }
        await apiFetch('/api/warga', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Warga baru berhasil ditambahkan');
      }
      onSaved();
    } catch (err: any) {
      setError(err?.error || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!data}
      onClose={onClose}
      title={editing ? 'Edit Data Warga' : 'Tambah Warga Baru'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleSubmit} loading={saving}>
            Simpan
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg bg-merah/10 px-4 py-2.5 text-sm text-merah">{error}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="NIK *"
          value={form.nik || ''}
          onChange={(e) => setForm({ ...form, nik: e.target.value })}
          hint="16 digit angka"
          maxLength={16}
          placeholder="Masukkan 16 digit NIK"
        />
        {isNew && (
          <div className="sm:col-span-2">
            <div className="flex items-center gap-4 mb-2">
              <button
                type="button"
                onClick={() => setKkMode('pilih')}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition ${
                  kkMode === 'pilih'
                    ? 'border-hijau bg-hijau/10 text-hijau'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                Pilih KK yang sudah ada
              </button>
              <button
                type="button"
                onClick={() => setKkMode('baru')}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition ${
                  kkMode === 'baru'
                    ? 'border-biru bg-biru/10 text-biru'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                Input KK Baru
              </button>
            </div>
            {kkMode === 'pilih' ? (
              <Select
                label="No. KK *"
                value={form.no_kk || ''}
                onChange={(e) => setForm({ ...form, no_kk: e.target.value })}
                options={listKK.map((kk) => ({
                  value: kk.no_kk,
                  label: `${kk.no_kk} — ${kk.nama_kepala}`,
                }))}
                placeholder="Pilih Kartu Keluarga"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="No. KK Baru *"
                  value={noKkBaru}
                  onChange={(e) => setNoKkBaru(e.target.value)}
                  placeholder="Masukkan nomor KK baru"
                />
                <Input
                  label="Nama Kepala Keluarga *"
                  value={namaKepalaBaru}
                  onChange={(e) => setNamaKepalaBaru(e.target.value)}
                  placeholder="Nama kepala keluarga baru"
                />
              </div>
            )}
          </div>
        )}
        <Input
          label="Nama Lengkap *"
          value={form.nama_lengkap || ''}
          onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
        />
        <Input
          label="Tempat Lahir"
          value={form.tempat_lahir || ''}
          onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })}
        />
        <Input
          label="Alamat Sesuai KTP"
          value={form.alamat_ktp || ''}
          onChange={(e) => setForm({ ...form, alamat_ktp: e.target.value })}
          className="sm:col-span-2"
          placeholder="Alamat lengkap sesuai KTP"
        />
        <Input
          label="Tanggal Lahir"
          type="date"
          value={form.tanggal_lahir || ''}
          onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
        />
        <Select
          label="Jenis Kelamin"
          value={form.jenis_kelamin || ''}
          onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
          options={[
            { value: 'Laki-laki', label: 'Laki-laki' },
            { value: 'Perempuan', label: 'Perempuan' },
          ]}
        />
        <Select
          label="Agama"
          value={form.agama || ''}
          onChange={(e) => setForm({ ...form, agama: e.target.value })}
          options={AGAMA_OPTIONS.map((a) => ({ value: a, label: a }))}
        />
        <Input
          label="Pekerjaan"
          value={form.pekerjaan || ''}
          onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })}
        />
        <Input
          label="Pendidikan"
          value={form.pendidikan || ''}
          onChange={(e) => setForm({ ...form, pendidikan: e.target.value })}
        />
        <Select
          label="Status Perkawinan"
          value={form.status_perkawinan || ''}
          onChange={(e) => setForm({ ...form, status_perkawinan: e.target.value })}
          options={[
            { value: 'Belum Kawin', label: 'Belum Kawin' },
            { value: 'Kawin', label: 'Kawin' },
            { value: 'Cerai Hidup', label: 'Cerai Hidup' },
            { value: 'Cerai Mati', label: 'Cerai Mati' },
          ]}
          placeholder="-"
        />
        <Select
          label="Status Hubungan"
          value={form.status_hubungan || ''}
          onChange={(e) => setForm({ ...form, status_hubungan: e.target.value })}
          options={HUBUNGAN_OPTIONS.map((h) => ({ value: h, label: h }))}
        />
        <Select
          label="Golongan Darah"
          value={form.golongan_darah || ''}
          onChange={(e) => setForm({ ...form, golongan_darah: e.target.value })}
          options={['A', 'B', 'AB', 'O'].map((g) => ({ value: g, label: g }))}
          placeholder="-"
        />
        <Select
          label="Status Ekonomi"
          value={form.status_ekonomi || ''}
          onChange={(e) => setForm({ ...form, status_ekonomi: e.target.value })}
          options={[
            { value: 'mampu', label: 'Mampu' },
            { value: 'rentan_miskin', label: 'Rentan Miskin' },
            { value: 'miskin', label: 'Miskin' },
          ]}
        />
        <Select
          label="Status Tinggal"
          value={form.status_tinggal || ''}
          onChange={(e) => setForm({ ...form, status_tinggal: e.target.value })}
          options={[
            { value: 'domisili_asli', label: 'Domisili Asli' },
            { value: 'sementara', label: 'Sementara' },
            { value: 'non_ktp', label: 'Non KTP' },
            { value: 'non_domisili', label: 'Non Domisili' },
          ]}
        />
        <Input
          label="Alamat Domisili"
          value={form.alamat_domisili || ''}
          onChange={(e) => setForm({ ...form, alamat_domisili: e.target.value })}
          className="sm:col-span-2"
          placeholder="Isi bila alamat domisili berbeda dengan KTP"
        />
        <Input
          label="Telepon"
          value={form.telepon || ''}
          onChange={(e) => setForm({ ...form, telepon: e.target.value })}
        />
        <Input
          label="Email"
          type="email"
          value={form.email || ''}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
    </Modal>
  );
}

// ── Import Modal ──────────────────────────────────────────────────
function ImportModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [sheet, setSheet] = useState<'Data Warga' | 'Data KK'>('Data Warga');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    berhasil: number;
    gagal: number;
    dilewati: number;
    errors: string[];
    pesan: string;
  } | null>(null);

  // Reset state tiap kali modal dibuka
  const handleClose = () => {
    setFile(null);
    setResult(null);
    setSheet('Data Warga');
    onClose();
  };

  const handleFile = (f: File) => {
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('File harus berformat .xlsx atau .xls');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) { toast.error('Pilih file terlebih dahulu'); return; }
    setLoading(true);
    setResult(null);
    try {
      const token = localStorage.getItem('token_majegan');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('sheet', sheet);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Import gagal');
        return;
      }
      setResult(data);
      if (data.berhasil > 0) {
        toast.success(`${data.berhasil} data berhasil diimport`);
        onSaved();
      }
    } catch {
      toast.error('Gagal menghubungi server');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const a = document.createElement('a');
    a.href = '/template_import_warga.xlsx';
    a.download = 'template_import_warga.xlsx';
    a.click();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import Data dari Excel"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Tutup
          </Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!file}>
            <Upload size={16} /> Mulai Import
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Unduh Template */}
        <div className="flex items-center justify-between rounded-lg bg-biru/10 border border-biru/30 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-biru">Belum punya template?</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Unduh template Excel resmi yang sudah menyertakan petunjuk pengisian</p>
          </div>
          <Button variant="biru" size="sm" onClick={downloadTemplate}>
            <FileSpreadsheet size={15} /> Unduh Template
          </Button>
        </div>

        {/* Pilih Sheet */}
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-2">
            Import ke sheet
          </label>
          <div className="flex gap-2">
            {(['Data Warga', 'Data KK'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setSheet(s); setResult(null); }}
                className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition ${
                  sheet === s
                    ? 'border-biru bg-biru/10 text-biru'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          {sheet === 'Data Warga' && (
            <p className="mt-1.5 text-xs text-[var(--text-muted)]">
              ⚠ Import Data KK terlebih dahulu sebelum import Data Warga
            </p>
          )}
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-import-input')?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
            dragOver
              ? 'border-biru bg-biru/10'
              : file
              ? 'border-hijau bg-hijau/5'
              : 'border-[var(--border)] hover:border-biru/50 hover:bg-slate-50 dark:hover:bg-slate-800/30'
          }`}
        >
          <input
            id="file-import-input"
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet size={32} className="text-hijau" />
              <p className="text-sm font-medium text-[var(--text)]">{file.name}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {(file.size / 1024).toFixed(1)} KB — klik untuk ganti file
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={32} className="text-[var(--text-muted)]" />
              <p className="text-sm font-medium text-[var(--text)]">
                Drag & drop file Excel di sini
              </p>
              <p className="text-xs text-[var(--text-muted)]">atau klik untuk pilih file (.xlsx / .xls)</p>
            </div>
          )}
        </div>

        {/* Hasil Import */}
        {result && (
          <div className="rounded-xl border border-[var(--border)] overflow-hidden">
            <div className={`px-4 py-3 flex items-center gap-2 ${result.gagal > 0 ? 'bg-kuning/10' : 'bg-hijau/10'}`}>
              {result.gagal > 0
                ? <AlertCircle size={18} className="text-kuning flex-shrink-0" />
                : <CheckCircle size={18} className="text-hijau flex-shrink-0" />
              }
              <p className="text-sm font-medium text-[var(--text)]">{result.pesan}</p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-[var(--border)] border-t border-[var(--border)]">
              <div className="px-4 py-3 text-center">
                <p className="text-xl font-bold text-hijau">{result.berhasil}</p>
                <p className="text-xs text-[var(--text-muted)]">Berhasil</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-xl font-bold text-merah">{result.gagal}</p>
                <p className="text-xs text-[var(--text-muted)]">Gagal</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-xl font-bold text-[var(--text-muted)]">{result.dilewati}</p>
                <p className="text-xs text-[var(--text-muted)]">Dilewati</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="border-t border-[var(--border)] px-4 py-3 max-h-40 overflow-y-auto">
                <p className="text-xs font-semibold text-merah mb-2">Detail error:</p>
                <ul className="space-y-1">
                  {result.errors.map((e, i) => (
                    <li key={i} className="text-xs text-[var(--text-muted)] font-mono">{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
