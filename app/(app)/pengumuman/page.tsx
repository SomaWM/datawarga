'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Card } from '@/components/ui/Card';
import EmptyState, { LoadingState } from '@/components/ui/EmptyState';
import { Input, Textarea } from '@/components/ui/Input';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Megaphone, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  kategori: string;
  penting: boolean;
  tanggal_mulai: string;
  tanggal_selesai: string;
  created_at: string;
  dibuat_oleh_nama?: string;
}

export default function PengumumanPage() {
  const [list, setList] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Pengumuman | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pengumuman | null>(null);
  const { hasRole } = useAuth();
  const canEdit = hasRole('dukuh');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<Pengumuman[]>('/api/pengumuman');
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
        <p className="text-sm text-[var(--text-muted)]">
          Total {list.length} pengumuman
        </p>
        {canEdit && (
          <Button onClick={() => setModal('new')}>
            <Plus size={18} /> Buat Pengumuman
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingState text="Memuat pengumuman..." />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada pengumuman"
            description="Buat pengumuman untuk warga Padukuhan Majegan."
            icon={<Megaphone size={28} />}
            action={
              canEdit ? (
                <Button onClick={() => setModal('new')}>
                  <Plus size={18} /> Buat Pengumuman
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((p) => (
            <Card key={p.id} padding="md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {p.penting && <Badge variant="merah">Penting</Badge>}
                    {p.kategori && p.kategori !== 'umum' && (
                      <Badge variant="abu">{p.kategori}</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-[var(--text)]">{p.judul}</h3>
                  <p className="mt-1.5 text-sm text-[var(--text-muted)] line-clamp-3 whitespace-pre-wrap">
                    {p.isi}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span>{formatDateTime(p.created_at)}</span>
                    {p.dibuat_oleh_nama && <span>· oleh {p.dibuat_oleh_nama}</span>}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setModal(p)}
                      className="rounded-lg p-1.5 text-biru hover:bg-biru/10 transition"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="rounded-lg p-1.5 text-merah hover:bg-merah/10 transition"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <PengumumanModal
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
        title="Hapus Pengumuman"
        message={`Yakin ingin menghapus pengumuman "${deleteTarget?.judul}"?`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await apiFetch(`/api/pengumuman/${deleteTarget.id}`, { method: 'DELETE' });
            toast.success('Pengumuman dihapus');
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

function PengumumanModal({
  data,
  onClose,
  onSaved,
}: {
  data: Pengumuman | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = data === 'new';
  const editing = isNew ? null : data;
  const [form, setForm] = useState<Partial<Pengumuman>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) setForm(editing);
    else if (isNew) setForm({ penting: false, kategori: 'umum' });
  }, [editing, isNew]);

  if (!data) return null;

  const submit = async () => {
    setError('');
    if (!form.judul || !form.isi) {
      setError('Judul dan isi wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/pengumuman/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        toast.success('Pengumuman diperbarui');
      } else {
        await apiFetch('/api/pengumuman', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Pengumuman dibuat');
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
      title={editing ? 'Edit Pengumuman' : 'Buat Pengumuman'}
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
      <div className="space-y-4">
        <Input
          label="Judul *"
          value={form.judul || ''}
          onChange={(e) => setForm({ ...form, judul: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Kategori"
            value={form.kategori || ''}
            onChange={(e) => setForm({ ...form, kategori: e.target.value })}
            placeholder="umum"
          />
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer pb-2">
              <input
                type="checkbox"
                checked={form.penting || false}
                onChange={(e) => setForm({ ...form, penting: e.target.checked })}
                className="h-4 w-4 rounded text-merah focus:ring-merah"
              />
              <span className="text-sm text-[var(--text)] flex items-center gap-1">
                <AlertCircle size={14} className="text-merah" /> Tandai Penting
              </span>
            </label>
          </div>
        </div>
        <Textarea
          label="Isi Pengumuman *"
          value={form.isi || ''}
          onChange={(e) => setForm({ ...form, isi: e.target.value })}
          className="min-h-[120px]"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Berlaku Mulai"
            type="date"
            value={form.tanggal_mulai || ''}
            onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })}
          />
          <Input
            label="Berlaku Sampai"
            type="date"
            value={form.tanggal_selesai || ''}
            onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  );
}
