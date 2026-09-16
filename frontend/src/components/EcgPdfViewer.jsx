import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Icon from './Icon.jsx';
import Spinner from './Spinner.jsx';

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function EcgPdfViewer({
  pdfUrl,
  fileName = 'ECG-Document.pdf',
  durationSec = 30,
  scaleInfo = '25 mm/s, 10 mm/mV',
  leadInfo = null,
}) {

  const containerRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1.2); // 120% default for crisp waveform viewing
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Pan & Drag states
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  // Timeline / horizontal scroll position
  const [scrollProgress, setScrollProgress] = useState({
    visibleStartSec: 0,
    visibleEndSec: durationSec || 30,
    ratio: 1,
    leftPercent: 0,
    widthPercent: 100,
  });

  // Load PDF Document safely with cancel protection
  useEffect(() => {
    let isCancelled = false;
    if (!pdfUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    loadingTask.promise
      .then((doc) => {
        if (isCancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setError('');
        setLoading(false);
      })
      .catch((err) => {
        if (isCancelled) return;
        if (err?.name === 'RenderingCancelledException' || err?.name === 'AbortException') return;
        console.error('PDF.js loading error:', err);
        setError('Dokumen PDF tidak dapat dimuat atau berkas belum diunggah.');
        setLoading(false);
      });

    return () => {
      isCancelled = true;
      if (loadingTask && loadingTask.destroy) {
        try {
          loadingTask.destroy();
        } catch (e) {}
      }
    };
  }, [pdfUrl]);

  // Update timeline scrubber on scroll
  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;

    const scrollLeft = el.scrollLeft;
    const clientWidth = el.clientWidth;
    const scrollWidth = el.scrollWidth;

    const duration = durationSec || 30;

    if (scrollWidth <= clientWidth) {
      setScrollProgress({
        visibleStartSec: 0,
        visibleEndSec: duration,
        ratio: 1,
        leftPercent: 0,
        widthPercent: 100,
      });
      return;
    }

    const startRatio = scrollLeft / scrollWidth;
    const endRatio = (scrollLeft + clientWidth) / scrollWidth;

    const startSec = Math.max(0, Number((startRatio * duration).toFixed(1)));
    const endSec = Math.min(duration, Number((endRatio * duration).toFixed(1)));

    const leftPercent = (scrollLeft / scrollWidth) * 100;
    const widthPercent = (clientWidth / scrollWidth) * 100;

    setScrollProgress({
      visibleStartSec: startSec,
      visibleEndSec: endSec,
      ratio: clientWidth / scrollWidth,
      leftPercent: Math.min(Math.max(leftPercent, 0), 100 - widthPercent),
      widthPercent: Math.min(widthPercent, 100),
    });
  }, [durationSec]);

  // Render current PDF page to canvas
  const renderPage = useCallback(
    async (pageNum, currentZoom) => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });

        // Unscaled viewport
        const unscaledViewport = page.getViewport({ scale: 1.0 });

        // High-DPI sharpness factor for Retina/HiDPI screens
        const dpr = Math.max(window.devicePixelRatio || 1, 1.5);
        const targetScale = currentZoom * dpr;

        const viewport = page.getViewport({ scale: targetScale });

        // Set display dimensions (CSS pixels)
        canvas.style.width = `${Math.floor(unscaledViewport.width * currentZoom)}px`;
        canvas.style.height = `${Math.floor(unscaledViewport.height * currentZoom)}px`;

        // Set backing store dimensions (physical pixels)
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          intent: 'print',
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        renderTaskRef.current = null;

        // Trigger scroll progress recalculation
        setTimeout(handleScroll, 50);
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('PDF render error:', err);
        }
      }
    },
    [pdfDoc, handleScroll]
  );

  useEffect(() => {
    renderPage(currentPage, zoom);
  }, [pdfDoc, currentPage, zoom, renderPage]);

  // Attach scroll listener
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(Number((z + 0.25).toFixed(2)), 4.0));
  const handleZoomOut = () => setZoom((z) => Math.max(Number((z - 0.25).toFixed(2)), 0.5));
  const handleResetZoom = () => setZoom(1.0);

  const handleFitWidth = () => {
    if (!pdfDoc || !scrollAreaRef.current) return;
    pdfDoc.getPage(currentPage).then((page) => {
      const viewport = page.getViewport({ scale: 1.0 });
      const containerWidth = scrollAreaRef.current.clientWidth - 48;
      const newZoom = Math.max(0.5, Math.min(containerWidth / viewport.width, 4.0));
      setZoom(Number(newZoom.toFixed(2)));
    });
  };

  const handleFitPage = () => {
    if (!pdfDoc || !scrollAreaRef.current) return;
    pdfDoc.getPage(currentPage).then((page) => {
      const viewport = page.getViewport({ scale: 1.0 });
      const containerWidth = scrollAreaRef.current.clientWidth - 48;
      const containerHeight = scrollAreaRef.current.clientHeight - 48;
      const scaleX = containerWidth / viewport.width;
      const scaleY = containerHeight / viewport.height;
      const newZoom = Math.max(0.5, Math.min(Math.min(scaleX, scaleY), 4.0));
      setZoom(Number(newZoom.toFixed(2)));
    });
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Mouse Pan/Drag Handlers
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    const el = scrollAreaRef.current;
    if (!el) return;

    setIsPanning(true);
    setPanStart({
      x: e.clientX,
      y: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    });
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    const el = scrollAreaRef.current;
    if (!el) return;

    e.preventDefault();
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    el.scrollLeft = panStart.scrollLeft - dx;
    el.scrollTop = panStart.scrollTop - dy;
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Timeline Scrubber click navigation
  const handleTimelineClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(clickX / rect.width, 1));
    const el = scrollAreaRef.current;
    if (el) {
      el.scrollLeft = clickRatio * el.scrollWidth - el.clientWidth / 2;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-50 rounded-2xl overflow-hidden border border-slate-300 shadow-sm select-none print:bg-white print:border-none print:shadow-none print:rounded-none print:p-0 print:overflow-visible ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen w-screen' : 'w-full'
      }`}
    >
      {/* Clean Clinical Minimal Toolbar (Hidden on Print) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-slate-700 print:hidden">
        {/* Left: Document Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-800 tracking-wide">
              Dokumen PDF Asli OMRON
            </span>
          </div>

          <span className="hidden sm:inline-block h-3.5 w-px bg-slate-200" />

          <span className="hidden md:inline-flex text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {scaleInfo}
          </span>

          {leadInfo && (
            <span className="hidden md:inline-flex text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Lead: {leadInfo}
            </span>
          )}

          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-600"
                title="Halaman Sebelumnya"
              >
                <Icon name="chevron_left" size={15} />
              </button>
              <span className="text-xs px-1.5 font-mono text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 text-slate-600"
                title="Halaman Selanjutnya"
              >
                <Icon name="chevron_right" size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Minimalistic Zoom & View Toolbar */}
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Zoom In/Out/Reset */}
          <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200 p-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-1 rounded hover:bg-white text-slate-700 disabled:opacity-30 transition-colors"
              title="Perkecil (Zoom Out)"
            >
              <Icon name="remove" size={15} />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-0.5 text-xs font-mono font-semibold text-slate-800 hover:bg-white rounded transition-colors"
              title="Reset ke 100%"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 4.0}
              className="p-1 rounded hover:bg-white text-slate-700 disabled:opacity-30 transition-colors"
              title="Perbesar (Zoom In)"
            >
              <Icon name="add" size={15} />
            </button>
          </div>

          {/* Fit Width */}
          <button
            type="button"
            onClick={handleFitWidth}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1 transition-colors"
            title="Sesuaikan Lebar Kontainer"
          >
            <Icon name="fit_screen" size={14} />
            <span className="hidden sm:inline">Fit Width</span>
          </button>

          {/* Fit Page */}
          <button
            type="button"
            onClick={handleFitPage}
            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1 transition-colors"
            title="Sesuaikan Halaman"
          >
            <Icon name="aspect_ratio" size={14} />
            <span className="hidden sm:inline">Fit Page</span>
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            <Icon name={isFullscreen ? 'fullscreen_exit' : 'fullscreen'} size={16} />
          </button>

          {/* Download Original PDF */}
          {pdfUrl && (
            <a
              href={pdfUrl}
              download={fileName}
              className="px-3 py-1 rounded-lg bg-[#0057B8] hover:bg-[#00479E] text-white text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
              title="Unduh Dokumen PDF Asli OMRON"
            >
              <Icon name="download" size={14} />
              <span>Unduh PDF</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Canvas Viewport Area - Light Neutral Clinical Workspace */}
      <div
        ref={scrollAreaRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative flex-1 overflow-auto bg-slate-100/90 p-4 sm:p-8 flex items-center justify-center min-h-[480px] print:bg-white print:p-0 print:min-h-0 print:h-auto print:overflow-visible ${
          isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[580px]'
        } ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ scrollBehavior: isPanning ? 'auto' : 'smooth' }}
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-20 print:hidden">
            <Spinner label="Memuat hasil ECG..." />
          </div>
        )}

        {/* Only show error if document completely failed to load and no PDF exists */}
        {error && !pdfDoc && (
          <div className="text-center p-6 max-w-md bg-white border border-rose-200 rounded-2xl shadow-sm print:hidden">
            <Icon name="warning" size={32} className="text-rose-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800 mb-1">Gagal Membuka PDF</h4>
            <p className="text-xs text-slate-500 mb-4">{error}</p>
            {pdfUrl && (
              <a
                href={pdfUrl}
                download={fileName}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0057B8] text-white text-xs rounded-lg font-semibold"
              >
                <Icon name="download" size={14} /> Unduh PDF Asli
              </a>
            )}
          </div>
        )}

        {/* Paper Document Container with subtle elevation */}
        <div className="relative inline-block bg-white shadow-md rounded border border-slate-200/80 overflow-hidden print:shadow-none print:border-none print:rounded-none print:w-full print:overflow-visible">
          <canvas ref={canvasRef} className="block max-w-none print:max-w-full print:w-full print:h-auto" />
        </div>
      </div>

      {/* Footer / ECG Duration Position Scrubber (Hidden on Print) */}
      <div className="bg-white border-t border-slate-200 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 print:hidden">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <Icon name="pan_tool" size={13} className="text-slate-400" />
          <span>Klik & geser (pan/drag) untuk navigasi detail gelombang</span>
        </div>

        {/* Interactive Timeline Bar */}
        <div className="w-full sm:w-72 flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-500 shrink-0">0s</span>
          <div
            onClick={handleTimelineClick}
            className="relative flex-1 h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300 cursor-pointer group"
            title="Linimasa Durasi Rekaman ECG (Klik untuk melompat)"
          >
            <div
              className="absolute top-0 bottom-0 bg-[#0057B8] group-hover:bg-[#00479E] rounded-full transition-all duration-75"
              style={{
                left: `${scrollProgress.leftPercent || 0}%`,
                width: `${scrollProgress.widthPercent || 100}%`,
              }}
            />
          </div>
          <span className="font-mono text-[10px] text-slate-500 shrink-0">{durationSec}s</span>
        </div>

        <div className="font-mono text-[11px] text-slate-600 font-semibold">
          Area Terlihat: <span className="text-[#0057B8]">{scrollProgress.visibleStartSec || 0}s – {scrollProgress.visibleEndSec || durationSec}s</span>
        </div>
      </div>
    </div>
  );
}

