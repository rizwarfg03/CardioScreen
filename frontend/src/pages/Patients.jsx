import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout.jsx';
import Icon from '../components/Icon.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorNotice from '../components/ErrorNotice.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatRelative } from '../utils/format.js';

const EMPTY_FORM = { nik: '', name: '', birth_date: '', sex: 'L', phone: '' };
const PAGE_SIZE = 25;

export default function Patients() {
  const { user } = useAuth();
  const canCreate = ['nurse', 'admin'].includes(user?.role);
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback((q, off = 0) => {
    setLoading(true);
    api
      .patients(q, PAGE_SIZE, off)
      .then((res) => {
        setPatients(res.data);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Tunda pencarian 300 ms supaya tidak menembak API tiap ketikan.
  // Ganti kata kunci selalu balik ke halaman pertama.
  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0);
      load(query, 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, load]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await api.createPatient(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      setOffset(0);
      load(query, 0);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const goToPage = (newOffset) => {
    setOffset(newOffset);
    load(query, newOffset);
  };

  const update = (field) => (event) => {
    let val = event.target.value;
    if (field === 'name') {
      val = val.replace(/[^a-zA-Z\s]/g, '');
    } else if (field === 'nik') {
      val = val.replace(/\D/g, '').slice(0, 16);
    } else if (field === 'phone') {
      val = val.replace(/\D/g, '').slice(0, 15);
    }
    setForm((f) => ({ ...f, [field]: val }));
  };

  return (
    <AppLayout breadcrumb={['Data Pasien']}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-md">
        <div>
          <h2 className="text-headline-lg">Data Pasien</h2>
          <p className="text-body-md text-on-surface-variant">Database rekam medis dan identitas pasien.</p>
        </div>
        {canCreate && (
          <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-primary">
            <Icon name={showForm ? 'close' : 'person_add'} size={20} />
            {showForm ? 'Batal' : 'Tambah Pasien'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-md mb-md grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <div>
            <label className="text-label-sm font-semibold" htmlFor="new-name">Nama Pasien *</label>
            <input
              id="new-name"
              type="text"
              inputMode="text"
              autoComplete="name"
              required
              value={form.name}
              onChange={update('name')}
              placeholder="Contoh: Mas Amin"
              className="field mt-1"
            />
          </div>
          <div>
            <label className="text-label-sm font-semibold" htmlFor="new-nik">NIK *</label>
            <input
              id="new-nik"
              type="text"
              inputMode="numeric"
              maxLength={16}
              placeholder="Contoh: 3501234567890001"
              required
              value={form.nik}
              onChange={update('nik')}
              className="field mt-1 font-mono"
            />
          </div>
          <div>
            <label className="text-label-sm font-semibold" htmlFor="new-phone">Nomor Telepon</label>
            <input
              id="new-phone"
              type="text"
              inputMode="numeric"
              maxLength={15}
              placeholder="Contoh: 081234567890"
              value={form.phone}
              onChange={update('phone')}
              className="field mt-1 font-mono"
            />
          </div>
          <div>
            <label className="text-label-sm font-semibold" htmlFor="new-birth">Tanggal Lahir</label>
            <input id="new-birth" type="date" value={form.birth_date} onChange={update('birth_date')} className="field mt-1" />
          </div>
          <div className="md:col-span-2">
            <label className="text-label-sm font-semibold" htmlFor="new-sex">Jenis Kelamin</label>
            <select id="new-sex" value={form.sex} onChange={update('sex')} className="field mt-1">
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>
          <div className="md:col-span-2 flex flex-col gap-2">
            <ErrorNotice message={formError} />
            <button type="submit" disabled={saving} className="btn-primary self-start">
              {saving ? 'Menyimpan...' : 'Simpan pasien'}
            </button>
          </div>
        </form>
      )}


      <div className="relative mb-md">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama atau NIK pasien"
          className="field pl-10"
          aria-label="Cari pasien"
        />
      </div>

      <ErrorNotice message={error} onRetry={() => load(query, offset)} />

      {loading ? (
        <Spinner label="Mencari pasien..." />
      ) : patients.length === 0 ? (
        <div className="card p-lg text-center text-on-surface-variant">
          <p className="text-body-md">Tidak ada pasien yang cocok dengan pencarian.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="table-head px-md py-3">Nama</th>
                <th className="table-head px-md py-3">NIK</th>
                <th className="table-head px-md py-3">Pemeriksaan</th>
                <th className="table-head px-md py-3">Terakhir diperiksa</th>
                <th className="table-head px-md py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-b border-outline-variant/60 last:border-0">
                  <td className="px-md py-3 text-body-md font-semibold">{p.name}</td>
                  <td className="px-md py-3 text-body-md font-mono">{p.nik}</td>
                  <td className="px-md py-3 text-body-md">{p.record_count}x</td>
                  <td className="px-md py-3 text-body-md text-on-surface-variant">
                    {p.last_exam_at ? formatRelative(p.last_exam_at) : 'Belum ada'}
                  </td>
                  <td className="px-md py-3 text-right">
                    <Link to={`/patients/${p.id}`} className="text-primary font-semibold text-label-sm">
                      Lihat riwayat
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && total > 0 && (
        <div className="flex items-center justify-between mt-md">
          <p className="text-label-sm text-on-surface-variant">
            Menampilkan {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} dari {total} pasien
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(Math.max(offset - PAGE_SIZE, 0))}
              disabled={offset === 0}
              className="btn-ghost py-2 px-3 disabled:opacity-40"
            >
              <Icon name="chevron_left" size={20} />
              Sebelumnya
            </button>
            <button
              type="button"
              onClick={() => goToPage(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total}
              className="btn-ghost py-2 px-3 disabled:opacity-40"
            >
              Berikutnya
              <Icon name="chevron_right" size={20} />
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
