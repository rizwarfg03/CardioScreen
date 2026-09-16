import Icon from './Icon.jsx';

/** Pesan gagal: sebutkan apa yang salah, lalu beri jalan keluarnya. */
export default function ErrorNotice({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 p-md rounded-lg bg-error-container text-on-error-container border border-error/20">
      <Icon name="error" size={20} />
      <div className="flex-1">
        <p className="text-body-md">{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="mt-2 text-label-sm font-semibold underline">
            Coba lagi
          </button>
        )}
      </div>
    </div>
  );
}
