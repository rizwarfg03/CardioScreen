import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout.jsx';
import Icon from '../components/Icon.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorNotice from '../components/ErrorNotice.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDateTime } from '../utils/format.js';
import { saveBlob } from '../utils/download.js';

const FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'abnormal', label: 'Abnormal' },
  { value: 'normal', label: 'Normal' },
];

const SEX_LABEL = { L: 'Laki-laki', P: 'Perempuan' };

export default function PatientHistory() {
  const { id } = useParams();
  const { user } = useAuth();
  const canEdit = ['nurse', 'admin'].includes(user?.role);
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([api.patient(id), api.patientRecords(id)])
      .then(([detail, history]) => {
        setPatient(detail.data);
        setRecords(history.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  const openEdit = () => {
    setEditForm({
      name: patient.name || '',
      birth_date: patient.birth_date || '',
      sex: patient.sex || 'L',
      phone: patient.phone || '',
      address: patient.address || '',
    });
    setEditError('');
    setShowEdit(true);
  };

  const updateEditField = (field) => (event) =>
    setEditForm((f) => ({ ...f, [field]: event.target.value }));

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    setEditError('');
    setSaving(true);
    try {
      const res = await api.updatePatient(patient.id, editForm);
      setPatient((p) => ({ ...p, ...res.data }));
      setShowEdit(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const downloadReport = async (record) => {
    setDownloadingId(record.id);
    setError('');
    try {
      const blob = await api.reportBlob(record.id);
      saveBlob(blob, `ECG-${patient.name.replace(/[^a-zA-Z0-9]+/g, '-')}-${record.id}.pdf`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const visible = records.filter((r) => {
    if (filter === 'abnormal') return r.is_abnormal;
    if (filter === 'normal') return !r.is_abnormal;
    return true;
  });

  return (
    <AppLayout breadcrumb={['Data Pasien', patient?.name || 'Riwayat']}>
      <ErrorNotice message={error} onRetry={load} />

      {loading ? (
        <Spinner label="Mengambil riwayat pemeriksaan..." />
      ) : patient ? (
        <div className="max-w-4xl mx-auto flex flex-col gap-md">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-headline-lg">{patient.name}</h2>
              <p className="text-body-md text-on-surface-variant font-mono">{patient.nik}</p>
              <p className="text-label-sm text-on-surface-variant mt-1">
                {SEX_LABEL[patient.sex] || 'Jenis kelamin belum diisi'}
                {patient.birth_date ? ` · Lahir ${patient.birth_date}` : ''}
                {patient.phone ? ` · ${patient.phone}` : ''}
              </p>
              <p className="text-label-sm text-on-surface-variant mt-1">
                {patient.stats.total || 0} pemeriksaan · {patient.stats.abnormal || 0} abnormal
                {patient.stats.avg_bpm ? ` · rata-rata ${patient.stats.avg_bpm} BPM` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => (showEdit ? setShowEdit(false) : openEdit())}
                  className="btn-ghost"
                >
                  <Icon name={showEdit ? 'close' : 'edit'} size={20} />
                  {showEdit ? 'Batal' : 'Edit data pasien'}
                </button>
              )}
              <Link to={`/upload?patientId=${patient.id}`} className="btn-primary">
                <Icon name="add_circle" size={20} />
                Rekam baru
              </Link>
            </div>
          </header>

          {showEdit && editForm && (
            <form onSubmit={handleSaveEdit} className="card p-md grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <div>
                <label className="text-label-sm font-semibold" htmlFor="edit-name">Nama lengkap</label>
                <input
                  id="edit-name"
                  required
                  value={editForm.name}
                  onChange={updateEditField('name')}
                  className="field mt-1"
                />
              </div>
              <div>
                <label className="text-label-sm font-semibold" htmlFor="edit-birth">Tanggal lahir</label>
                <input
                  id="edit-birth"
                  type="date"
                  value={editForm.birth_date}
                  onChange={updateEditField('birth_date')}
                  className="field mt-1"
                />
              </div>
              <div>
                <label className="text-label-sm font-semibold" htmlFor="edit-sex">Jenis kelamin</label>
                <select id="edit-sex" value={editForm.sex} onChange={updateEditField('sex')} className="field mt-1">
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="text-label-sm font-semibold" htmlFor="edit-phone">Nomor telepon</label>
                <input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={updateEditField('phone')}
                  className="field mt-1"
                  inputMode="tel"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-label-sm font-semibold" htmlFor="edit-address">Alamat</label>
                <input
                  id="edit-address"
                  value={editForm.address}
                  onChange={updateEditField('address')}
                  className="field mt-1"
                />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <ErrorNotice message={editError} />
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="btn-primary self-start">
                    {saving ? 'Menyimpan...' : 'Simpan perubahan'}
                  </button>
                  <button type="button" onClick={() => setShowEdit(false)} className="btn-ghost self-start">
                    Batal
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="flex gap-1 p-1 bg-surface-container rounded-lg border border-outline-variant self-start">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`px-4 py-2 text-label-sm rounded transition-all ${
                  filter === item.value
                    ? 'bg-surface-container-lowest border border-outline-variant font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="card p-lg text-center">
              <p className="text-body-md text-on-surface-variant mb-2">
                {records.length === 0
                  ? 'Pasien ini belum punya rekaman ECG tersimpan.'
                  : 'Tidak ada rekaman yang cocok dengan filter ini.'}
              </p>
              {records.length === 0 && (
                <Link to={`/upload?patientId=${patient.id}`} className="text-primary font-semibold text-body-md">
                  Unggah rekaman pertama
                </Link>
              )}
            </div>
          ) : (
            <ol className="flex flex-col gap-gutter">
              {visible.map((record) => (
                <li key={record.id} className="card p-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-headline-sm">{formatDateTime(record.recorded_at || record.created_at)}</p>
                      <p className="text-label-sm text-on-surface-variant">
                        Diunggah oleh {record.uploaded_by_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={record.is_abnormal ? 'abnormal' : 'normal'}>{record.classification}</StatusBadge>
                      {record.status === 'reviewed' && <StatusBadge tone="info">Ditinjau</StatusBadge>}
                      <button
                        type="button"
                        onClick={() => downloadReport(record)}
                        disabled={downloadingId === record.id}
                        className="p-2 rounded text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors disabled:opacity-50"
                        aria-label={`Unduh ringkasan PDF pemeriksaan ${formatDateTime(record.recorded_at || record.created_at)}`}
                      >
                        <Icon name="picture_as_pdf" size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-lg mt-md">
                    <div>
                      <p className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                        Rata-rata BPM
                      </p>
                      <p className={`text-metric-display ${record.is_abnormal ? 'text-error' : 'text-on-surface'}`}>
                        {record.bpm ?? '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Durasi</p>
                      <p className="text-body-md mt-1">
                        {record.duration_sec ? `${record.duration_sec} detik` : 'Tidak tercatat'}
                      </p>
                    </div>
                    <Link to={`/ecg/${record.id}`} className="btn-ghost ml-auto py-2 px-3">
                      <Icon name="visibility" size={18} />
                      Lihat detail
                    </Link>
                  </div>

                  {record.notes && (
                    <div className="mt-md pt-md border-t border-outline-variant/60">
                      <p className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold flex items-center gap-1">
                        <Icon name="edit_note" size={16} />
                        Catatan petugas
                      </p>
                      <p className="text-body-md text-on-surface-variant mt-1">{record.notes}</p>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}
    </AppLayout>
  );
}
