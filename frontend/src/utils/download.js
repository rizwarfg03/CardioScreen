/**
 * Simpan Blob jadi berkas unduhan.
 *
 * Endpoint berkas butuh header Authorization, sedangkan <a download> tidak bisa
 * mengirim header. Jadi isinya diambil dulu lewat fetch, baru dijadikan tautan
 * sementara yang langsung diklik dan dibuang.
 */
export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
