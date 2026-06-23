'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import SearchBar from '@/components/ui/SearchBar';
import Button from '@/components/ui/Button';
import Badge, { badgeSurat } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState, { LoadingState } from '@/components/ui/EmptyState';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { formatTanggal } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FileText, Plus, Printer, Trash2, Pencil, Filter } from 'lucide-react';

interface Surat {
  id: string;
  nomor_surat: string;
  jenis_surat: string;
  pemohon_nik: string;
  pemohon_nama: string;
  perihal: string;
  keperluan: string;
  status: string;
  catatan: string;
  created_at: string;
  dibuat_oleh_nama?: string;
}

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

export default function SuratPage() {
  const [list, setList] = useState<Surat[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalNew, setModalNew] = useState(false);
  const [modalStatus, setModalStatus] = useState<Surat | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Surat | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterJenis) params.set('jenis', filterJenis);
      const res = await apiFetch<{ data: Surat[]; total: number }>(`/api/surat?${params}`);
      setList(res.data || []);
      setTotal(res.total || 0);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filterStatus, filterJenis]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Cari nomor surat atau pemohon..."
            className="flex-1"
          />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="form-input lg:w-44"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
            <option value="ditolak">Ditolak</option>
          </select>
          <select
            value={filterJenis}
            onChange={(e) => {
              setFilterJenis(e.target.value);
              setPage(1);
            }}
            className="form-input lg:w-56"
          >
            <option value="">Semua Jenis</option>
            {JENIS_SURAT.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
          <Button onClick={() => setModalNew(true)} className="whitespace-nowrap">
            <Plus size={18} /> Buat Surat
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <LoadingState text="Memuat data surat..." />
        ) : list.length === 0 ? (
          <EmptyState
            title="Belum ada surat"
            description="Buat surat baru atau ubah filter pencarian."
            icon={<FileText size={28} />}
            action={
              <Button onClick={() => setModalNew(true)}>
                <Plus size={18} /> Buat Surat
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[var(--text-muted)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nomor Surat</th>
                  <th className="px-4 py-3 text-left font-medium">Jenis</th>
                  <th className="px-4 py-3 text-left font-medium">Pemohon</th>
                  <th className="px-4 py-3 text-left font-medium">Tanggal</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {list.map((s) => {
                  const b = badgeSurat(s.status);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text)]">
                        {s.nomor_surat}
                      </td>
                      <td className="px-4 py-3 text-[var(--text)]">{s.jenis_surat}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[var(--text)]">{s.pemohon_nama}</p>
                        {s.pemohon_nik && (
                          <p className="text-xs text-[var(--text-muted)] font-mono">
                            {s.pemohon_nik}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {formatTanggal(s.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={b.variant}>{b.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setModalStatus(s)}
                            className="rounded-lg p-1.5 text-biru hover:bg-biru/10 transition"
                            title="Update status"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => cetakSurat(s)}
                            className="rounded-lg p-1.5 text-hijau hover:bg-hijau/10 transition"
                            title="Cetak surat"
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(s)}
                            className="rounded-lg p-1.5 text-merah hover:bg-merah/10 transition"
                            title="Hapus surat"
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
            <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <SuratBaruModal
        open={modalNew}
        onClose={() => setModalNew(false)}
        onSaved={() => {
          setModalNew(false);
          loadData();
        }}
      />

      <StatusModal
        surat={modalStatus}
        onClose={() => setModalStatus(null)}
        onSaved={() => {
          setModalStatus(null);
          loadData();
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Surat"
        message={`Yakin ingin menghapus surat ${deleteTarget?.nomor_surat}? Tindakan ini tidak bisa dibatalkan.`}
        loading={saving}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setSaving(true);
          try {
            await apiFetch(`/api/surat/${deleteTarget.id}`, { method: 'DELETE' });
            toast.success('Surat berhasil dihapus');
            setDeleteTarget(null);
            loadData();
          } catch (err: any) {
            toast.error(err?.error || 'Gagal menghapus surat');
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}

// ── Cetak Surat ──────────────────────────────────────────────────
function cetakSurat(s: Surat) {
  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) {
    toast.error('Popup diblokir. Izinkan popup untuk mencetak.');
    return;
  }
  win.document.write(`
    <html><head><title>Surat ${s.nomor_surat}</title>
    <style>
      body { font-family: 'Times New Roman', serif; padding: 40px; color: #000; }
      .kop { text-align: center; border-bottom: 3px double #000; padding-bottom: 15px; margin-bottom: 30px; }
      .kop h1 { font-size: 18px; margin: 0; }
      .kop h2 { font-size: 22px; margin: 5px 0; text-decoration: underline; }
      .kop p { font-size: 12px; margin: 2px 0; }
      .judul { text-align: center; font-size: 16px; font-weight: bold; text-decoration: underline; margin: 30px 0 20px; }
      .nomor { text-align: center; font-size: 13px; margin-bottom: 30px; }
      .body { font-size: 13px; line-height: 1.8; }
      table { width: 100%; font-size: 13px; }
      td { padding: 4px 0; vertical-align: top; }
      td:first-child { width: 150px; }
      .ttd { margin-top: 60px; display: flex; justify-content: flex-end; text-align: center; }
      .ttd-nama { font-weight: bold; text-decoration: underline; margin-top: 80px; }
    </style></head><body>
    <div class="kop">
      <h1>PEMERINTAH KABUPATEN SLEMAN</h1>
      <h2>DESA PANDOWOHARJO</h2>
      <p>DUSUN MAJEGAN</p>
    </div>
    <div class="judul">${s.jenis_surat.toUpperCase()}</div>
    <div class="nomor">Nomor: ${s.nomor_surat}</div>
    <div class="body">
      <p>Yang bertanda tangan di bawah ini Kepala Padukuhan Majegan, Desa Pandowoharjo, Kecamatan Sleman, Kabupaten Sleman, menerangkan bahwa:</p>
      <table>
        <tr><td>Nama</td><td>: ${s.pemohon_nama || '-'}</td></tr>
        <tr><td>NIK</td><td>: ${s.pemohon_nik || '-'}</td></tr>
        <tr><td>Keperluan</td><td>: ${s.keperluan || '-'}</td></tr>
      </table>
      <p>Surat keterangan ini dibuat untuk keperluan sebagaimana tersebut di atas.</p>
    </div>
    <div class="ttd">
      <div>
        <p>Sleman, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p>Kepala Padukuhan Majegan</p>
        <div class="ttd-nama">____________________</div>
      </div>
    </div>
    <script>window.onload = () => { window.print(); }</script>
    </body></html>
  `);
  win.document.close();
}

// ── Modal Buat Surat Baru ────────────────────────────────────────
function SuratBaruModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    jenis_surat: JENIS_SURAT[0],
    pemohon_nik: '',
    pemohon_nama: '',
    perihal: '',
    keperluan: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        jenis_surat: JENIS_SURAT[0],
        pemohon_nik: '',
        pemohon_nama: '',
        perihal: '',
        keperluan: '',
      });
      setError('');
    }
  }, [open]);

  const submit = async () => {
    setError('');
    if (!form.pemohon_nama) {
      setError('Nama pemohon wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/api/surat', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      toast.success('Surat berhasil dibuat');
      onSaved();
    } catch (err: any) {
      setError(err?.error || 'Gagal membuat surat');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Surat Baru"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button onClick={submit} loading={saving}>
            Buat Surat
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg bg-merah/10 px-4 py-2.5 text-sm text-merah">{error}</div>
      )}
      <div className="space-y-4">
        <Select
          label="Jenis Surat *"
          value={form.jenis_surat}
          onChange={(e) => setForm({ ...form, jenis_surat: e.target.value })}
          options={JENIS_SURAT.map((j) => ({ value: j, label: j }))}
        />
        <Input
          label="Nama Pemohon *"
          value={form.pemohon_nama}
          onChange={(e) => setForm({ ...form, pemohon_nama: e.target.value })}
          placeholder="Nama lengkap pemohon"
        />
        <Input
          label="NIK Pemohon"
          value={form.pemohon_nik}
          onChange={(e) => setForm({ ...form, pemohon_nik: e.target.value })}
          placeholder="16 digit NIK"
        />
        <Input
          label="Perihal"
          value={form.perihal}
          onChange={(e) => setForm({ ...form, perihal: e.target.value })}
        />
        <Textarea
          label="Keperluan"
          value={form.keperluan}
          onChange={(e) => setForm({ ...form, keperluan: e.target.value })}
          placeholder="Jelaskan keperluan surat..."
        />
      </div>
    </Modal>
  );
}

// ── Modal Update Status ──────────────────────────────────────────
function StatusModal({
  surat,
  onClose,
  onSaved,
}: {
  surat: Surat | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState('pending');
  const [catatan, setCatatan] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (surat) {
      setStatus(surat.status);
      setCatatan(surat.catatan || '');
    }
  }, [surat]);

  if (!surat) return null;

  const submit = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/surat/${surat.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, catatan }),
      });
      toast.success('Status surat diperbarui');
      onSaved();
    } catch (err: any) {
      toast.error(err?.error || 'Gagal update status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={!!surat}
      onClose={onClose}
      title="Update Status Surat"
      size="sm"
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
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
          <p className="text-sm font-medium text-[var(--text)]">{surat.jenis_surat}</p>
          <p className="text-xs text-[var(--text-muted)] font-mono">{surat.nomor_surat}</p>
          <p className="text-sm text-[var(--text)] mt-1">{surat.pemohon_nama}</p>
        </div>
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'diproses', label: 'Diproses' },
            { value: 'selesai', label: 'Selesai' },
            { value: 'ditolak', label: 'Ditolak' },
          ]}
        />
        <Textarea
          label="Catatan"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Catatan untuk pemohon (opsional)"
        />
      </div>
    </Modal>
  );
}
