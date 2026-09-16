import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout.jsx';
import Icon from '../components/Icon.jsx';
import StatCard from '../components/StatCard.jsx';
import Spinner from '../components/Spinner.jsx';
import ErrorNotice from '../components/ErrorNotice.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api } from '../api/client.js';
import { formatDateTime, formatUptime, ROLE_LABEL } from '../utils/format.js';

const EMPTY_USER = { name: '', role: 'nurse', password: '' };

export default function AdminDashboard() {
  const [health, setHealth] = useState(null);
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_USER);
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [createdAccount, setCreatedAccount] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([api.health(), api.logs(20), api.users()])
      .then(([h, l, u]) => {
        setHealth(h.data);
        setLogs(l.data);
        setUsers(u.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    // Kartu kesehatan sistem menyegarkan diri tiap 30 detik.
    const timer = setInterval(() => api.health().then((h) => setHealth(h.data)).catch(() => {}), 30000);
    return () => clearInterval(timer);
  }, [load]);

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setFormError('');
    try {
      const res = await api.createUser(form);
      setForm(EMPTY_USER);
      setShowForm(false);
      setCreatedAccount(res.data);
      load();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const toggleUser = async (u) => {
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }));

  return (
    <AppLayout
      breadcrumb={['Sistem & Admin']}
      actions={
        <button type="button" onClick={load} className="text-on-surface-variant hover:text-primary" aria-label="Muat ulang">
          <Icon name="refresh" />
        </button>
      }
    >
      <div className="mb-md">
        <h2 className="text-headline-lg">Sistem &amp; administrasi</h2>
        <p className="text-body-md text-on-surface-variant">
          Kondisi server, jejak aktivitas, dan pengelolaan akun petugas.
        </p>
      </div>

      <ErrorNotice message={error} onRetry={load} />

      {loading && !health ? (
        <Spinner label="Mengambil status sistem..." />
      ) : health ? (
        <div className="flex flex-col gap-lg">
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
            <StatCard label="Server aktif" value={formatUptime(health.uptimeSeconds)} icon="check_circle" />
            <StatCard label="Latensi API" value={health.apiLatencyMs} unit="ms" icon="speed" />
            <StatCard label="Total rekaman" value={health.totals.records} icon="database" />
            <StatCard label="Rekaman hari ini" value={health.totals.recordsToday} icon="trending_up" />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
            <div className="card p-md">
              <p className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-2">
                Status database
              </p>
              <StatusBadge tone={health.database === 'Connected' ? 'normal' : 'abnormal'}>{health.database}</StatusBadge>
              <p className="text-body-md text-on-surface-variant mt-3">
                Database {health.storage.databaseMb} MB · berkas unggahan {health.storage.uploadsMb} MB
              </p>
              <p className="text-label-sm text-outline mt-1">Mode: {health.env}</p>
            </div>
            <div className="card p-md">
              <p className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-2">Isi data</p>
              <ul className="text-body-md space-y-1">
                <li>{health.totals.users} akun petugas</li>
                <li>{health.totals.patients} pasien terdaftar</li>
                <li>{health.totals.records} rekaman ECG</li>
              </ul>
            </div>
            <div className="card p-md">
              <p className="text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-2">
                Waktu server
              </p>
              <p className="text-body-md">{formatDateTime(health.serverTime)}</p>
              <p className="text-label-sm text-on-surface-variant mt-2">
                Cocokkan dengan jam alat supaya waktu rekam tidak melenceng.
              </p>
            </div>
          </section>

          <section className="card">
            <div className="flex items-center justify-between p-md border-b border-outline-variant">
              <h3 className="text-headline-md">Akun petugas</h3>
              <button
                type="button"
                onClick={() => {
                  setCreatedAccount(null);
                  setShowForm((v) => !v);
                }}
                className="text-label-sm text-primary font-semibold"
              >
                {showForm ? 'Batal' : 'Tambah akun'}
              </button>
            </div>

            {createdAccount && (
              <div className="mx-md mt-md p-md rounded-lg bg-tertiary-fixed-dim/10 border border-tertiary-fixed-dim flex items-start justify-between gap-4">
                <div>
                  <p className="text-body-md font-semibold">
                    Akun {createdAccount.name} ({ROLE_LABEL[createdAccount.role] || createdAccount.role}) berhasil dibuat.
                  </p>
                  <p className="text-body-md mt-1">
                    Kode staf: <span className="font-mono font-semibold">{createdAccount.staff_code}</span> — catat dan
                    berikan ke staf yang bersangkutan, kode ini dipakai untuk login.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreatedAccount(null)}
                  aria-label="Tutup"
                  className="text-on-surface-variant hover:text-on-surface"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            )}

            {showForm && (
              <form onSubmit={handleCreateUser} className="p-md grid grid-cols-1 md:grid-cols-3 gap-gutter border-b border-outline-variant">
                <div>
                  <label className="text-label-sm font-semibold" htmlFor="u-name">Nama</label>
                  <input id="u-name" required value={form.name} onChange={update('name')} className="field mt-1" />
                </div>
                <div>
                  <label className="text-label-sm font-semibold" htmlFor="u-role">Peran</label>
                  <select id="u-role" value={form.role} onChange={update('role')} className="field mt-1">
                    <option value="nurse">Perawat</option>
                    <option value="doctor">Dokter</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-label-sm font-semibold" htmlFor="u-pass">Password awal</label>
                  <input id="u-pass" type="password" required minLength={8} value={form.password} onChange={update('password')} className="field mt-1" />
                </div>
                <div className="md:col-span-3 flex flex-col gap-2">
                  <p className="text-label-sm text-on-surface-variant">
                    Kode staf (kredensial login) akan dibuat otomatis oleh sistem setelah akun disimpan.
                  </p>
                  <ErrorNotice message={formError} />
                  <button type="submit" className="btn-primary self-start">Buat akun</button>
                </div>
              </form>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="table-head px-md py-3">Nama</th>
                    <th className="table-head px-md py-3">Kode Staf</th>
                    <th className="table-head px-md py-3">Peran</th>
                    <th className="table-head px-md py-3">Login terakhir</th>
                    <th className="table-head px-md py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-outline-variant/60 last:border-0">
                      <td className="px-md py-3 text-body-md font-semibold">{u.name}</td>
                      <td className="px-md py-3 text-body-md font-mono">{u.staff_code}</td>
                      <td className="px-md py-3 text-body-md">{ROLE_LABEL[u.role] || u.role}</td>
                      <td className="px-md py-3 text-body-md text-on-surface-variant">
                        {u.last_login_at ? formatDateTime(u.last_login_at) : 'Belum pernah'}
                      </td>
                      <td className="px-md py-3 text-right">
                        <button type="button" onClick={() => toggleUser(u)} className="text-label-sm font-semibold text-primary">
                          {u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <div className="flex items-center justify-between p-md border-b border-outline-variant">
              <h3 className="text-headline-md">Jejak aktivitas</h3>
              <span className="text-label-sm text-on-surface-variant">{logs.length} entri terakhir</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="table-head px-md py-3">Waktu</th>
                    <th className="table-head px-md py-3">Pengguna</th>
                    <th className="table-head px-md py-3">Aktivitas</th>
                    <th className="table-head px-md py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-outline-variant/60 last:border-0">
                      <td className="px-md py-3 text-body-md font-mono text-on-surface-variant">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="px-md py-3 text-body-md">{log.actor}</td>
                      <td className="px-md py-3 text-body-md">{log.action}</td>
                      <td className="px-md py-3 text-right">
                        <StatusBadge tone={log.status === 'success' ? 'normal' : 'abnormal'}>
                          {log.status === 'success' ? 'Berhasil' : 'Gagal'}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </AppLayout>
  );
}
