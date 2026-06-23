'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import SearchBar from '@/components/ui/SearchBar';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import EmptyState, { LoadingState } from '@/components/ui/EmptyState';
import { Input, Textarea } from '@/components/ui/Input';
import { formatTanggal } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Skull, Plus, Trash2, Pencil } from 'lucide-react';

interface Kematian {
  id: string;
  nik: string;
  nama_lengkap: string;
  tanggal_lahir: string;
  tanggal_meninggal: string;
  usia_jenazah: string;
  alamat: string;
  penyebab_kematian: string;
  tempat_meninggal: string;
  lokasi_pemakaman: string;
  catatan: string;
}

export default function KematianPage() {
  const [list, setList] = useState<Kematian[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Kematian | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Kematian | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      const res = await apiFetch<{ data: Kematian[]; total: number }>(`/api/kematian?${params}`);
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
          placeholder="Cari nama atau NIK..."
          className="flex-1"
        />
        <Button onClick={() => setModal('new')} className="whitespace-nowrap">
          <Plus size={18} /> Tambah Data
        </Button>
      </div>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <LoadingState text="Memuat data kematian..." />
        ) : list.length === 0 ? (
          <EmptyState
            title="Belum ada data kematian"
            icon={<Skull size={28} />}
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
                  <th className="px-4 py-3 text-left font-medium">Nama</th>
                  <th className="px-4 py-3 text-left font-medium">NIK</th>
                  <th className="px-4 py-3 text-left font-medium">Tgl Meninggal</th>
                  <th className="px-4 py-3 text-left font-medium">Usia</th>
                  <th className="px-4 py-3 text-left font-medium">Penyebab</th>
                  <th className="px-4 py-3 text-left font-medium">Pemakaman</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {list.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{k.nama_lengkap}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{k.nik || '-'}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {formatTanggal(k.tanggal_meninggal)}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{k.usia_jenazah || '-'}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{k.penyebab_kematian || '-'}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{k.lokasi_pemakaman || '-'}</td>
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

      <KematianModal
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
        title="Hapus Data Kematian"
        message={`Yakin ingin menghapus data "${deleteTarget?.nama_lengkap}"?`}
        loading={saving}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setSaving(true);
          try {
            await apiFetch(`/api/kematian/${deleteTarget.id}`, { method: 'DELETE' });
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

function KematianModal({
  data,
  onClose,
  onSaved,
}: {
  data: Kematian | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = data === 'new';
  const editing = isNew ? null : data;
  const [form, setForm] = useState<Partial<Kematian>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) setForm(editing);
    else if (isNew) setForm({});
  }, [editing, isNew]);

  if (!data) return null;

  const submit = async () => {
    setError('');
    if (!form.nama_lengkap || !form.tanggal_meninggal) {
      setError('Nama lengkap dan tanggal meninggal wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/kematian/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        toast.success('Data berhasil diperbarui');
      } else {
        await apiFetch('/api/kematian', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        toast.success('Data kematian berhasil ditambahkan');
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
      title={editing ? 'Edit Data Kematian' : 'Tambah Data Kematian'}
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
          label="Nama Lengkap *"
          value={form.nama_lengkap || ''}
          onChange={(e) => setForm({ ...form, nama_lengkap: e.target.value })}
        />
        <Input
          label="NIK"
          value={form.nik || ''}
          onChange={(e) => setForm({ ...form, nik: e.target.value })}
        />
        <Input
          label="Tanggal Meninggal *"
          type="date"
          value={form.tanggal_meninggal || ''}
          onChange={(e) => setForm({ ...form, tanggal_meninggal: e.target.value })}
        />
        <Input
          label="Usia Saat Meninggal"
          value={form.usia_jenazah || ''}
          onChange={(e) => setForm({ ...form, usia_jenazah: e.target.value })}
          placeholder="cth: 75 tahun"
        />
        <Input
          label="Tempat Meninggal"
          value={form.tempat_meninggal || ''}
          onChange={(e) => setForm({ ...form, tempat_meninggal: e.target.value })}
        />
        <Input
          label="Penyebab Kematian"
          value={form.penyebab_kematian || ''}
          onChange={(e) => setForm({ ...form, penyebab_kematian: e.target.value })}
        />
        <Input
          label="Lokasi Pemakaman"
          value={form.lokasi_pemakaman || ''}
          onChange={(e) => setForm({ ...form, lokasi_pemakaman: e.target.value })}
        />
        <Input
          label="Alamat"
          value={form.alamat || ''}
          onChange={(e) => setForm({ ...form, alamat: e.target.value })}
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
