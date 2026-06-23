'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import SearchBar from '@/components/ui/SearchBar';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import EmptyState, { LoadingState } from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import { FileImage, Search, CheckCircle2, XCircle, Upload, Eye, Trash2 } from 'lucide-react';

interface WargaDok {
  nik: string;
  nama_lengkap: string;
  foto_ktp: string | null;
  foto_kk: string | null;
  no_kk: string;
  alamat?: string;
  rt?: string;
  rw?: string;
}

export default function DokumenPage() {
  const [list, setList] = useState<WargaDok[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<WargaDok | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: WargaDok[] }>(`/api/warga?limit=9999`);
      // Filter warga yang punya no_kk (data KK)
      setList((res.data || []).filter((w) => w.nik));
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = list.filter((w) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return w.nama_lengkap?.toLowerCase().includes(q) || w.nik?.includes(q);
  });

  return (
    <div className="space-y-4">
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Cari nama atau NIK..."
      />

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <LoadingState text="Memuat status dokumen..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Belum ada data warga"
            description="Tambahkan data warga terlebih dahulu di halaman Data Warga."
            icon={<FileImage size={28} />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[var(--text-muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nama</th>
                  <th className="px-4 py-3 text-left font-medium">NIK</th>
                  <th className="px-4 py-3 text-center font-medium">KTP</th>
                  <th className="px-4 py-3 text-center font-medium">KK</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((w) => (
                  <tr key={w.nik} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{w.nama_lengkap}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{w.nik}</td>
                    <td className="px-4 py-3 text-center">
                      {w.foto_ktp ? (
                        <Badge variant="hijau">
                          <CheckCircle2 size={12} className="mr-1" /> Ada
                        </Badge>
                      ) : (
                        <Badge variant="abu">
                          <XCircle size={12} className="mr-1" /> Belum
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {w.foto_kk ? (
                        <Badge variant="hijau">
                          <CheckCircle2 size={12} className="mr-1" /> Ada
                        </Badge>
                      ) : (
                        <Badge variant="abu">
                          <XCircle size={12} className="mr-1" /> Belum
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDetail(w)}
                        className="rounded-lg px-3 py-1.5 text-sm font-medium text-hijau hover:bg-hijau/10 transition"
                      >
                        Kelola
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <DokumenDetailModal
        warga={detail}
        onClose={() => setDetail(null)}
        onUpdated={loadData}
      />
    </div>
  );
}

function DokumenDetailModal({
  warga,
  onClose,
  onUpdated,
}: {
  warga: WargaDok | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [uploading, setUploading] = useState(false);

  if (!warga) return null;

  const upload = async (tipe: 'ktp' | 'kk', file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('nik', warga.nik);
      formData.append('tipe', tipe);
      formData.append('file', file);
      await apiFetch('/api/dokumen/upload', { method: 'POST', body: formData });
      toast.success(`${tipe.toUpperCase()} berhasil diupload`);
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err?.error || `Gagal upload ${tipe.toUpperCase()}`);
    } finally {
      setUploading(false);
    }
  };

  const hapus = async (tipe: 'ktp' | 'kk') => {
    if (!confirm(`Yakin hapus dokumen ${tipe.toUpperCase()}?`)) return;
    try {
      await apiFetch(`/api/dokumen/${warga.nik}?tipe=${tipe}`, { method: 'DELETE' });
      toast.success(`${tipe.toUpperCase()} dihapus`);
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err?.error || 'Gagal menghapus');
    }
  };

  const preview = async (tipe: 'ktp' | 'kk') => {
    try {
      const path = tipe === 'ktp' ? warga.foto_ktp : warga.foto_kk;
      if (!path) return;
      const res = await apiFetch<{ url: string }>(`/api/dokumen/download?path=${encodeURIComponent(path)}`);
      window.open(res.url, '_blank');
    } catch (err: any) {
      toast.error(err?.error || 'Gagal membuka dokumen');
    }
  };

  return (
    <Modal open={!!warga} onClose={onClose} title={`Kelola Dokumen - ${warga.nama_lengkap}`} size="lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(['ktp', 'kk'] as const).map((tipe) => {
          const ada = tipe === 'ktp' ? warga.foto_ktp : warga.foto_kk;
          return (
            <div key={tipe} className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-[var(--text)]">Dokumen {tipe.toUpperCase()}</h4>
                {ada ? (
                  <Badge variant="hijau">Tersedia</Badge>
                ) : (
                  <Badge variant="abu">Belum ada</Badge>
                )}
              </div>
              <div className="space-y-2">
                {ada && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => preview(tipe)}>
                    <Eye size={16} /> Lihat
                  </Button>
                )}
                <label className="flex items-center justify-center gap-2 cursor-pointer rounded-lg bg-hijau px-3 py-2 text-sm font-medium text-white hover:bg-hijau-muda transition">
                  <Upload size={16} /> {ada ? 'Ganti' : 'Upload'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) upload(tipe, f);
                      e.target.value = '';
                    }}
                  />
                </label>
                {ada && (
                  <Button variant="ghost" size="sm" className="w-full text-merah" onClick={() => hapus(tipe)}>
                    <Trash2 size={16} /> Hapus
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-[var(--text-muted)]">
        Format: JPG, PNG, WEBP, PDF. Maksimal 5MB.
      </div>
    </Modal>
  );
}
