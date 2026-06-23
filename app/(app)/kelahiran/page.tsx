'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import SearchBar from '@/components/ui/SearchBar';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import EmptyState, { LoadingState } from '@/components/ui/EmptyState';
import { Input, Textarea } from '@/components/ui/Input';
import { formatTanggal } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Baby, Plus, Trash2, Pencil } from 'lucide-react';

interface Kelahiran {
  id: string;
  no_kk: string;
  nama_bayi: string;
  nama_ibu: string;
  nama_ayah: string;
  tanggal_lahir: string;
  jam_lahir: string;
  jenis_kelamin: string;
  berat_lahir: string;
  tinggi_lahir: string;
  tempat_lahir: string;
  catatan: string;
}

export default function KelahiranPage() {
  const [list, setList] = useState<Kelahiran[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Kelahiran | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Kelahiran | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      const res = await apiFetch<{ data: Kelahiran[]; total: number }>(`/api/kelahiran?${params}`);
      setList(res.data || []);
      setTotal(res.total || 0);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Cari nama bayi, ibu, atau ayah..."
          className="flex-1"
        />
        <Button onClick={() => setModal('new')} className="whitespace-nowrap">
          <Plus size={18} /> Tambah Data
        </Button>
      </div>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <LoadingState text="Memuat data kelahiran..." />
        ) : list.length === 0 ? (
          <EmptyState
            title="Belum ada data kelahiran"
            icon={<Baby size={28} />}
            action={
              <Button onClick={() => setModal('new')}>
                <Plus size={18} /> Tambah Data
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[var(--text-muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nama Bayi</th>
                  <th className="px-4 py-3 text-left font-medium">L/P</th>
                  <th className="px-4 py-3 text-left font-medium">Tgl Lahir</th>
                  <th className="px-4 py-3 text-left font-medium">Nama Ibu</th>
                  <th className="px-4 py-3 text-left font-medium">Nama Ayah</th>
                  <th className="px-4 py-3 text-left font-medium">Tempat</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {list.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{k.nama_bayi}</td>
                    <td className="px-4 py-3">
                      <Badge variant={k.jenis_kelamin === 'Laki-laki' ? 'biru' : 'merah'}>
                        {k.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {formatTanggal(k.tanggal_lahir)}
                    </td>
                    <td className="px-4 py-3 text-[var(--text)]">{k.nama_ibu || '-'}</td>
                    <td className="px-4 py-3 text-[var(--text)]">{k.nama_ayah || '-'}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{k.tempat_lahir || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setModal(k)}
                          className="rounded-lg p-1.5 text-biru hover:bg-biru/10 transition"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(k)}
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

      <KelahiranModal
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
        title="Hapus Data Kelahiran"
        message={`Yakin ingin menghapus data "${deleteTarget?.nama_bayi}"?`}
        loading={saving}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setSaving(true);
          try {
            await apiFetch(`/api/kelahiran/${deleteTarget.id}`, { method: 'DELETE' });
            toast.success('Data berhasil dihapus');
            setDeleteTarget(null);
            loadData();
          } catch (err: any) {
            toast.error(err?.error || 'Gagal menghapus');
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}

function KelahiranModal({
  data,
  onClose,
  onSaved,
}: {
  data: Kelahiran | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = data === 'new';
  const editing = isNew ? null : data;
  const [form, setForm] = useState<Partial<Kelahiran>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) setForm(editing);
    else if (isNew) setForm({ jenis_kelamin: 'Laki-laki' });
  }, [editing, isNew]);

  if (!data) return null;

  const submit = async () => {
    setError('');
    if (!form.nama_bayi || !form.tanggal_lahir) {
      setError('Nama bayi dan tanggal lahir wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/kelahiran/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        toast.success('Data berhasil diperbarui');
      } else {
        await apiFetch('/api/kelahiran', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Data kelahiran berhasil ditambahkan');
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
      title={editing ? 'Edit Data Kelahiran' : 'Tambah Data Kelahiran'}
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
          label="Nama Bayi *"
          value={form.nama_bayi || ''}
          onChange={(e) => setForm({ ...form, nama_bayi: e.target.value })}
        />
        <div>
          <label className="form-label">Jenis Kelamin</label>
          <select
            value={form.jenis_kelamin || ''}
            onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}
            className="form-input"
          >
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>
        <Input
          label="Tanggal Lahir *"
          type="date"
          value={form.tanggal_lahir || ''}
          onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })}
        />
        <Input
          label="Jam Lahir"
          type="time"
          value={form.jam_lahir || ''}
          onChange={(e) => setForm({ ...form, jam_lahir: e.target.value })}
        />
        <Input
          label="Nama Ibu"
          value={form.nama_ibu || ''}
          onChange={(e) => setForm({ ...form, nama_ibu: e.target.value })}
        />
        <Input
          label="Nama Ayah"
          value={form.nama_ayah || ''}
          onChange={(e) => setForm({ ...form, nama_ayah: e.target.value })}
        />
        <Input
          label="Berat Lahir (kg)"
          value={form.berat_lahir || ''}
          onChange={(e) => setForm({ ...form, berat_lahir: e.target.value })}
          placeholder="cth: 3.2"
        />
        <Input
          label="Panjang Lahir (cm)"
          value={form.tinggi_lahir || ''}
          onChange={(e) => setForm({ ...form, tinggi_lahir: e.target.value })}
          placeholder="cth: 48"
        />
        <Input
          label="Tempat Lahir"
          value={form.tempat_lahir || ''}
          onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })}
          placeholder="RS / Bidan / Puskesmas"
        />
        <Input
          label="No. KK"
          value={form.no_kk || ''}
          onChange={(e) => setForm({ ...form, no_kk: e.target.value })}
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
