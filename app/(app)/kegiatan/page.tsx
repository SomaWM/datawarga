'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge, { badgeKegiatan } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState, { LoadingState } from '@/components/ui/EmptyState';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { formatTanggal } from '@/lib/utils';
import toast from 'react-hot-toast';
import { CalendarDays, Plus, Pencil, Trash2, MapPin, Clock } from 'lucide-react';

interface Kegiatan {
  id: string;
  nama_kegiatan: string;
  deskripsi: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  penanggung_jawab: string;
  status: string;
}

export default function KegiatanPage() {
  const [list, setList] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Kegiatan | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Kegiatan | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<Kegiatan[]>('/api/kegiatan');
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
        <p className="text-sm text-[var(--text-muted)]">Total {list.length} kegiatan</p>
        <Button onClick={() => setModal('new')}>
          <Plus size={18} /> Tambah Kegiatan
        </Button>
      </div>

      {loading ? (
        <LoadingState text="Memuat kegiatan..." />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            title="Belum ada kegiatan"
            description="Tambahkan jadwal kegiatan dukuh."
            icon={<CalendarDays size={28} />}
            action={
              <Button onClick={() => setModal('new')}>
                <Plus size={18} /> Tambah Kegiatan
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((k) => {
            const b = badgeKegiatan(k.status);
            return (
              <Card key={k.id} padding="md">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex flex-col items-center justify-center bg-hijau/10 text-hijau rounded-lg px-3 py-2 flex-shrink-0">
                      <span className="text-lg font-bold leading-none">
                        {k.tanggal ? new Date(k.tanggal).getDate() : '-'}
                      </span>
                      <span className="text-xs leading-none mt-0.5">
                        {k.tanggal
                          ? new Date(k.tanggal).toLocaleDateString('id-ID', { month: 'short' })
                          : ''}
                      </span>
                    </div>
                    <h3 className="font-semibold text-[var(--text)] leading-snug">
                      {k.nama_kegiatan}
                    </h3>
                  </div>
                  <Badge variant={b.variant}>{b.label}</Badge>
                </div>
                {k.deskripsi && (
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-3">{k.deskripsi}</p>
                )}
                <div className="space-y-1.5 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} />
                    <span>{formatTanggal(k.tanggal)}</span>
                  </div>
                  {k.waktu && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>{k.waktu}</span>
                    </div>
                  )}
                  {k.lokasi && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      <span>{k.lokasi}</span>
                    </div>
                  )}
                  {k.penanggung_jawab && (
                    <p className="pt-1">PJ: {k.penanggung_jawab}</p>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--border)] flex justify-end gap-1">
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
              </Card>
            );
          })}
        </div>
      )}

      <KegiatanModal
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
        title="Hapus Kegiatan"
        message={`Yakin ingin menghapus "${deleteTarget?.nama_kegiatan}"?`}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await apiFetch(`/api/kegiatan/${deleteTarget.id}`, { method: 'DELETE' });
            toast.success('Kegiatan dihapus');
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

function KegiatanModal({
  data,
  onClose,
  onSaved,
}: {
  data: Kegiatan | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = data === 'new';
  const editing = isNew ? null : data;
  const [form, setForm] = useState<Partial<Kegiatan>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editing) setForm(editing);
    else if (isNew) setForm({ status: 'rencana' });
  }, [editing, isNew]);

  if (!data) return null;

  const submit = async () => {
    setError('');
    if (!form.nama_kegiatan || !form.tanggal) {
      setError('Nama kegiatan dan tanggal wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/kegiatan/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
        toast.success('Kegiatan diperbarui');
      } else {
        await apiFetch('/api/kegiatan', { method: 'POST', body: JSON.stringify(form) });
        toast.success('Kegiatan dibuat');
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
      title={editing ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
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
          label="Nama Kegiatan *"
          value={form.nama_kegiatan || ''}
          onChange={(e) => setForm({ ...form, nama_kegiatan: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Tanggal *"
            type="date"
            value={form.tanggal || ''}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
          />
          <Input
            label="Waktu"
            type="time"
            value={form.waktu || ''}
            onChange={(e) => setForm({ ...form, waktu: e.target.value })}
          />
        </div>
        <Input
          label="Lokasi"
          value={form.lokasi || ''}
          onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Penanggung Jawab"
            value={form.penanggung_jawab || ''}
            onChange={(e) => setForm({ ...form, penanggung_jawab: e.target.value })}
          />
          <Select
            label="Status"
            value={form.status || 'rencana'}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { value: 'rencana', label: 'Rencana' },
              { value: 'berlangsung', label: 'Berlangsung' },
              { value: 'selesai', label: 'Selesai' },
              { value: 'batal', label: 'Batal' },
            ]}
          />
        </div>
        <Textarea
          label="Deskripsi"
          value={form.deskripsi || ''}
          onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
        />
      </div>
    </Modal>
  );
}
