import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

export default function DoctorSignaturePad({ onSave, onCancel, defaultDoctorName = '', defaultDoctorLicense = '' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [doctorName, setDoctorName] = useState(defaultDoctorName);
  const [doctorLicense, setDoctorLicense] = useState(defaultDoctorLicense);
  const [error, setError] = useState('');

  // Setup Canvas resolution & context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#0F172A'; // Dark navy ink
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasDrawn(true);
    setError('');
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
  };

  const handleSave = () => {
    if (!doctorName.trim()) {
      setError('Nama dokter pemeriksa wajib diisi.');
      return;
    }
    if (!hasDrawn) {
      setError('Harap bubuhkan tanda tangan dokter pada kanvas di bawah.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL('image/png');

    onSave({
      doctorName: doctorName.trim(),
      doctorLicense: doctorLicense.trim() || null,
      doctorSignature: signatureData,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-lg space-y-4 max-w-lg w-full">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0057B8] flex items-center justify-center">
            <Icon name="verified_user" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Verifikasi & Tanda Tangan Dokter</h3>
            <p className="text-[11px] text-slate-500">Konfirmasi legalitas klinis hasil pemeriksaan ECG</p>
          </div>
        </div>
        {onCancel && (
          <button type="button" onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-700">
            <Icon name="close" size={18} />
          </button>
        )}
      </div>

      {error && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <Icon name="warning" size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Doctor Name & License Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
            Nama Lengkap Dokter *
          </label>
          <input
            type="text"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="dr. Nama Dokter, Sp.JP"
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
            SIP / NIP Dokter (Opsional)
          </label>
          <input
            type="text"
            value={doctorLicense}
            onChange={(e) => setDoctorLicense(e.target.value)}
            placeholder="SIP. 446/123/SDK/2026"
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
          />
        </div>
      </div>

      {/* Signature Canvas Area */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
            Bubuhkan Tanda Tangan Digital *
          </label>
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-slate-500 hover:text-rose-600 font-semibold flex items-center gap-1"
          >
            <Icon name="delete" size={13} />
            <span>Hapus / Ulangi</span>
          </button>
        </div>

        <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-white transition-colors overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-36 block cursor-crosshair touch-none"
          />

          {!hasDrawn && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
              <Icon name="draw" size={24} className="mb-1 opacity-60" />
              <span className="text-xs">Tanda tangani di sini (mouse, stylus, atau touch)</span>
            </div>
          )}

          {/* Baseline guide line */}
          <div className="absolute bottom-6 left-8 right-8 border-b border-dashed border-slate-300 pointer-events-none" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2 text-xs font-semibold bg-[#0057B8] hover:bg-[#00479E] text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Icon name="check" size={16} />
          <span>Verifikasi & Simpan Laporan</span>
        </button>
      </div>
    </div>
  );
}
