import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetSession = () => {
    localStorage.removeItem('cardiosync.token');
    localStorage.removeItem('cardiosync.user');
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center p-6 text-slate-800 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Terjadi Kesalahan Tampilan</h2>
            <p className="text-sm text-slate-500 mb-4">
              Terjadi kendala saat merender komponen antarmuka. Silakan coba muat ulang atau masuk kembali.
            </p>
            {this.state.error && (
              <div className="bg-slate-50 rounded-xl p-3 mb-6 text-left overflow-auto max-h-36 text-xs font-mono text-rose-600 border border-slate-200">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary/90 transition shadow-sm"
              >
                Muat Ulang Halaman
              </button>
              <button
                type="button"
                onClick={this.handleResetSession}
                className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-700 rounded-full font-semibold text-sm hover:bg-slate-200 transition"
              >
                Reset Sesi Login
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
