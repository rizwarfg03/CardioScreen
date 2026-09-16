import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

/**
 * Menggambar sinyal ECG di atas kertas grid ala rekam jantung.
 *
 * Komponen ini hanya menggambar SAMPEL ASLI dari berkas. Kalau berkas yang
 * diunggah tidak memuat data numerik (mis. PDF berisi gambar hasil pindai),
 * yang tampil adalah pesan kosong — bukan gelombang tiruan. Grafik palsu di
 * layar klinis berbahaya karena bisa dikira hasil pengukuran betulan.
 */
export default function EcgWaveform({ samples, sampleRate = 250, zoom = 1, height = 260 }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper || !samples || samples.length === 0) return undefined;

    const draw = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = wrapper.clientWidth;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // Kertas grid: kotak kecil 10px, kotak tebal tiap 50px.
      ctx.strokeStyle = '#f3c8c8';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= width; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.strokeStyle = '#e4a3a3';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Skala vertikal mengikuti rentang sinyal supaya seluruh gelombang muat.
      const visible = Math.max(Math.floor(samples.length / zoom), 2);
      const slice = samples.slice(0, visible);
      const min = Math.min(...slice);
      const max = Math.max(...slice);
      const span = max - min || 1;
      const padding = 12;
      const usable = height - padding * 2;

      ctx.strokeStyle = '#16211D';
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      slice.forEach((value, i) => {
        const x = (i / (slice.length - 1)) * width;
        const y = padding + usable - ((value - min) / span) * usable;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [samples, zoom, height]);

  if (!samples || samples.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low
                   flex flex-col items-center justify-center gap-2 text-center px-md"
        style={{ height }}
      >
        <Icon name="monitor_heart" className="text-on-surface-variant" size={32} />
        <p className="text-body-md text-on-surface-variant max-w-md">
          Berkas ini tidak memuat data sinyal numerik, jadi gelombang tidak bisa digambar ulang.
          Buka berkas aslinya di bawah untuk melihat rekaman dari alat.
        </p>
        <p className="text-label-sm text-outline">
          Unggah berkas CSV/TXT berisi sampel mV kalau ingin grafik interaktif.
        </p>
      </div>
    );
  }

  const durationSec = (samples.length / zoom / sampleRate).toFixed(1);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <canvas ref={canvasRef} className="w-full rounded-lg border border-outline-variant bg-white" />
      <div className="absolute bottom-2 right-3 flex gap-2 text-label-sm text-on-surface-variant bg-white/80 px-2 py-1 rounded">
        <span>25 mm/s</span>
        <span>10 mm/mV</span>
        <span>{durationSec}s</span>
      </div>
    </div>
  );
}
