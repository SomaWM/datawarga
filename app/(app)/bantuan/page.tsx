'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import SearchBar from '@/components/ui/SearchBar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState, { LoadingState } from '@/components/ui/EmptyState';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { formatTanggal, formatRupiah } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import toast from 'react-hot-toast';
import { HandCoins, Plus, Pencil, Trash2, Users, Package } from 'lucide-react';

interface JenisBantuan {
  id: string;
  kode: string;
  nama: string;
  penyelenggara: string;
  kategori: string;
  deskripsi: string;
  aktif: boolean;
}

interface BantuanWarga {
  id: string;
  jenis_bantuan_id: string;
  nik: string;
  nama_lengkap: string;
  nama_bantuan: string;
  kode_bantuan: string;
  bentuk: string;
  jumlah_uang: number | null;
  satuan_uang: string;
  deskripsi_barang: string;
  periode_mulai: string;
  periode_selesai: string;
  status: string;
  catatan: string;
}

type TabType = 'penerima' | 'jenis';

export default function BantuanPage() {
  const [tab, setTab] = useState<TabType>('penerima');
  const { hasRole } = useAuth();
  const canKelolaJenis = hasRole('dukuh');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)]">
        <button
          onClick={() => setTab('penerima')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            tab === 'penerima'
              ? 'border-hijau text-hijau'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Users size={16} /> Penerima Bantuan
        </button>
        <button
          onClick={() => setTab('jenis')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            tab === 'jenis'
              ? 'border-hijau text-hijau'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Package size={16} /> Jenis Bantuan
        </button>
      </div>

      {tab === 'penerima' ? <PenerimaTab /> : <JenisTab canEdit={canKelolaJenis} />}
    </div>
  );
}

// ── Tab Penerima ─────────────────────────────────────────────────
function PenerimaTab() {
  const [list, setList] = useState<BantuanWarga[]>([]);
  const [jenisList, setJenisList] = useState<JenisBantuan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<BantuanWarga | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BantuanWarga | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (filterJenis) params.set('jenis_bantuan_id', filterJenis);
      if (filterStatus) params.set('status', filterStatus);
      const [res, jenis] = await Promise.all([
        apiFetch<{ data: BantuanWarga[]; total: number }>(`/api/bantuan/warga?${params}`),
        apiFetch<JenisBantuan[]>('/api/bantuan/jenis'),
      ]);
      setList(res.data || []);
      setTotal(res.total || 0);
      setJenisList(jenis || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filterJenis, filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statusVariant = (s: string): 'hijau' | 'kuning' | 'merah' | 'abu' => {
    const map: Record<string, 'hijau' | 'kuning' | 'merah' | 'abu'> = {
      aktif: 'hijau',
      ditangguhkan: 'kuning',
      tidak_layak: 'merah',
      selesai: 'abu',
    };
    return map[s] || 'abu';
  };

  return (
    <div className="space-y-4">
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Cari nama, NIK, atau bantuan..."
            className="flex-1"
          />
          <select
            value={filterJenis}
            onChange={(e) => {
              setFilterJenis(e.target.value);
              setPage(1);
            }}
            className="form-input lg:w-52"
          >
            <option value="">Semua Jenis</option>
            {jenisList.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nama}
              </option>
            ))}
          </select>
          <Button onClick={() => setModal('new')} className="whitespace-nowrap">
            <Plus size={18} /> Tambah Penerima
          </Button>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <LoadingState text="Memuat data penerima..." />
        ) : list.length === 0 ? (
          <EmptyState
            title="Belum ada penerima bantuan"
            icon={<HandCoins size={28} />}
            action={
              <Button onClick={() => setModal('new')}>
                <Plus size={18} /> Tambah Penerima
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[var(--text-muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nama</th>
                  <th className="px-4 py-3 text-left font-medium">NIK</th>
                  <th className="px-4 py-3 text-left font-medium">Bantuan</th>
                  <th className="px-4 py-3 text-left font-medium">Bentuk</th>
                  <th className="px-4 py-3 text-left font-medium">Jumlah</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {list.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{b.nama_lengkap}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{b.nik}</td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--text)]">{b.nama_bantuan}</p>
                      <p className="text-xs text-[var(--text-muted)] font-mono">{b.kode_bantuan}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-[var(--text-muted)]">{b.bentuk}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {b.bentuk === 'uang' || b.bentuk === 'campuran'
                        ? formatRupiah(b.jumlah_uang)
                        : b.deskripsi_barang || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setModal(b)}
                          className="rounded-lg p-1.5 text-biru hover:bg-biru/10 transition"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(b)}
                          className="rounded-lg p-1.5 text-merah hover:bg-merah/10 transition"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <BantuanWargaModal
        data={modal}
        jenisList={jenisList}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null);
          loadData();
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Penerima Bantuan"
        message={`Yakin hapus data bantuan "${deleteTarget?.nama_lengkap}"?`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await apiFetch(`/api/bantuan/warga/${deleteTarget.id}`, { method: 'DELETE' });
            toast.success('Data dihapus');
            setDeleteTarget(null);
            loadData();
          } catch (err: any) {
            toast.error(err?.error || 'Gagal menghapus');
          }
        }}
      />
    </div>
  );
}

function BantuanWargaModal({
  data,
  jenisList,
  onClose,
  onSaved,
}: {
  data: BantuanWarga | 'new' | null;
  jenisList: JenisBantuan[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = data === 'new';
  const editing = isNew ? null : data;
  const [form, setForm] = useState<Partial<BantuanWarga>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) setForm(editing);
    else if (isNew)
      setForm({ bentuk: 'uang', satuan_uang: 'IDR', status: 'aktif' });
  }, [editing, isNew]);

  if (!data) return null;

  const submit = async () => {
    setError('');
    if (!form.nik || !form.jenis_bantuan_id || !form.periode_mulai || !form.bentuk) {
      setError('NIK, jenis bantuan, periode mulai, dan bentuk wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/bantuan/warga/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        toast.success('Data diperbarui');
      } else {
        await apiFetch('/api/bantuan/warga', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Penerima bantuan ditambahkan');
      }
      onSaved();
    } catch (err: any) {
      setError(err?.error || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!data}
      onClose={onClose}
      title={editing ? 'Edit Penerima Bantuan' : 'Tambah Penerima Bantuan'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={submit} loading={saving}>
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
        />
        <Input
          label="Nama Penerima"
          value={form.nama_lengkap || ''}
          onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
        />
        <Select
          label="Jenis Bantuan *"
          value={form.jenis_bantuan_id || ''}
          onChange={(e) => setForm({ ...form, jenis_bantuan_id: e.target.value })}
          options={jenisList.map((j) => ({ value: j.id, label: `${j.nama} (${j.kode})` }))}
          placeholder="Pilih bantuan"
        />
        <Select
          label="Bentuk Bantuan *"
          value={form.bentuk || 'uang'}
          onChange={(e) => setForm({ ...form, bentuk: e.target.value })}
          options={[
            { value: 'uang', label: 'Uang' },
            { value: 'barang', label: 'Barang' },
            { value: 'campuran', label: 'Campuran' },
          ]}
        />
        <Input
          label="Periode Mulai *"
          type="date"
          value={form.periode_mulai || ''}
          onChange={(e) => setForm({ ...form, periode_mulai: e.target.value })}
        />
        <Input
          label="Periode Selesai"
          type="date"
          value={form.periode_selesai || ''}
          onChange={(e) => setForm({ ...form, periode_selesai: e.target.value })}
        />
        {(form.bentuk === 'uang' || form.bentuk === 'campuran') && (
          <Input
            label="Jumlah Uang"
            type="number"
            value={form.jumlah_uang || ''}
            onChange={(e) => setForm({ ...form, jumlah_uang: Number(e.target.value) })}
          />
        )}
        {(form.bentuk === 'barang' || form.bentuk === 'campuran') && (
          <Input
            label="Deskripsi Barang"
            value={form.deskripsi_barang || ''}
            onChange={(e) => setForm({ ...form, deskripsi_barang: e.target.value })}
          />
        )}
        <Select
          label="Status"
          value={form.status || 'aktif'}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          options={[
            { value: 'aktif', label: 'Aktif' },
            { value: 'ditangguhkan', label: 'Ditangguhkan' },
            { value: 'tidak_layak', label: 'Tidak Layak' },
            { value: 'selesai', label: 'Selesai' },
          ]}
        />
      </div>
      <div className="mt-4">
        <Textarea
          label="Catatan"
          value={form.catatan || ''}
          onChange={(e) => setForm({ ...form, catatan: e.target.value })}
        />
      </div>
    </Modal>
  );
}

// ── Tab Jenis Bantuan ────────────────────────────────────────────
function JenisTab({ canEdit }: { canEdit: boolean }) {
  const [list, setList] = useState<JenisBantuan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<JenisBantuan | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<JenisBantuan | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<JenisBantuan[]>('/api/bantuan/jenis');
      setList(res || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-[var(--text-muted)]">Total {list.length} jenis bantuan</p>
        {canEdit && (
          <Button onClick={() => setModal('new')}>
            <Plus size={18} /> Tambah Jenis
          </Button>
        )}
      </div>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <LoadingState text="Memuat jenis bantuan..." />
        ) : list.length === 0 ? (
          <EmptyState title="Belum ada jenis bantuan" icon={<Package size={28} />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[var(--text-muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Kode</th>
                  <th className="px-4 py-3 text-left font-medium">Nama</th>
                  <th className="px-4 py-3 text-left font-medium">Penyelenggara</th>
                  <th className="px-4 py-3 text-left font-medium">Kategori</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                  {canEdit && <th className="px-4 py-3 text-right font-medium">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {list.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text)]">{j.kode}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{j.nama}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{j.penyelenggara || '-'}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{j.kategori || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {j.aktif ? (
                        <Badge variant="hijau">Aktif</Badge>
                      ) : (
                        <Badge variant="abu">Nonaktif</Badge>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setModal(j)}
                            className="rounded-lg p-1.5 text-biru hover:bg-biru/10 transition"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(j)}
                            className="rounded-lg p-1.5 text-merah hover:bg-merah/10 transition"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <JenisModal
        data={modal}
        onClose={() => setModal(null)}
        onSaved={() => {
          setModal(null);
          loadData();
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Jenis Bantuan"
        message={`Yakin hapus "${deleteTarget?.nama}"? Tidak bisa dihapus jika sudah ada penerima.`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await apiFetch(`/api/bantuan/jenis/${deleteTarget.id}`, { method: 'DELETE' });
            toast.success('Jenis bantuan dihapus');
            setDeleteTarget(null);
            loadData();
          } catch (err: any) {
            toast.error(err?.error || 'Gagal menghapus');
          }
        }}
      />
    </div>
  );
}

function JenisModal({
  data,
  onClose,
  onSaved,
}: {
  data: JenisBantuan | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = data === 'new';
  const editing = isNew ? null : data;
  const [form, setForm] = useState<Partial<JenisBantuan>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) setForm(editing);
    else if (isNew) setForm({ aktif: true });
  }, [editing, isNew]);

  if (!data) return null;

  const submit = async () => {
    setError('');
    if (!form.kode || !form.nama) {
      setError('Kode dan nama wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/bantuan/jenis/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        toast.success('Jenis bantuan diperbarui');
      } else {
        await apiFetch('/api/bantuan/jenis', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Jenis bantuan ditambahkan');
      }
      onSaved();
    } catch (err: any) {
      setError(err?.error || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!data}
      onClose={onClose}
      title={editing ? 'Edit Jenis Bantuan' : 'Tambah Jenis Bantuan'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={submit} loading={saving}>
            Simpan
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg bg-merah/10 px-4 py-2.5 text-sm text-merah">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Kode *"
          value={form.kode || ''}
          onChange={(e) => setForm({ ...form, kode: e.target.value.toUpperCase() })}
          placeholder="cth: PKH"
        />
        <Input
          label="Kategori"
          value={form.kategori || ''}
          onChange={(e) => setForm({ ...form, kategori: e.target.value })}
          placeholder="cth: Sosial"
        />
      </div>
      <div className="mt-4 space-y-4">
        <Input
          label="Nama Bantuan *"
          value={form.nama || ''}
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
        />
        <Input
          label="Penyelenggara"
          value={form.penyelenggara || ''}
          onChange={(e) => setForm({ ...form, penyelenggara: e.target.value })}
        />
        <Textarea
          label="Deskripsi"
          value={form.deskripsi || ''}
          onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.aktif !== false}
            onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
            className="h-4 w-4 rounded text-hijau focus:ring-hijau"
          />
          <span className="text-sm text-[var(--text)]">Aktif</span>
        </label>
      </div>
    </Modal>
  );
}
