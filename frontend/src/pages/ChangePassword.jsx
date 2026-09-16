import { useState } from 'react';
import AppLayout from '../components/AppLayout.jsx';
import Icon from '../components/Icon.jsx';
import ErrorNotice from '../components/ErrorNotice.jsx';
import { api } from '../api/client.js';

const EMPTY_FORM = { currentPassword: '', newPassword: '', confirmPassword: '' };

/** Halaman untuk staf yang sudah login ganti password sendiri, tanpa perlu minta admin reset. */
export default function ChangePassword() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (field) => (event) => {
    setSuccess(false);
    setForm((f) => ({ ...f, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess(false);

    if (form.newPassword.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setSaving(true);
    try {
      await api.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm(EMPTY_FORM);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout breadcrumb={['Ganti Password']}>
      <div className="max-w-md mx-auto flex flex-col gap-md">
        <div>
          <h2 className="text-headline-lg">Ganti password</h2>
          <p className="text-body-md text-on-surface-variant">
            Gunakan password baru minimal 8 karakter yang mudah kamu ingat tapi sulit ditebak orang lain.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-md flex flex-col gap-md">
          <div className="flex flex-col gap-base">
            <label className="text-label-sm font-semibold" htmlFor="current-password">
              Password saat ini
            </label>
            <input
              id="current-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={form.currentPassword}
              onChange={update('currentPassword')}
              className="field"
            />
          </div>

          <div className="flex flex-col gap-base">
            <label className="text-label-sm font-semibold" htmlFor="new-password">
              Password baru
            </label>
            <input
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={form.newPassword}
              onChange={update('newPassword')}
              className="field"
            />
          </div>

          <div className="flex flex-col gap-base">
            <label className="text-label-sm font-semibold" htmlFor="confirm-password">
              Ulangi password baru
            </label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={form.confirmPassword}
              onChange={update('confirmPassword')}
              className="field"
            />
          </div>

          <label className="flex items-center gap-2 text-label-sm text-on-surface-variant">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            Tampilkan password
          </label>

          <ErrorNotice message={error} />
          {success && (
            <p className="text-body-md text-tertiary flex items-center gap-2">
              <Icon name="check_circle" size={20} />
              Password berhasil diganti.
            </p>
          )}

          <button type="submit" disabled={saving} className="btn-primary self-start">
            {saving ? 'Menyimpan...' : 'Simpan password baru'}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
