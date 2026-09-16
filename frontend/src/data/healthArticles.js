/**
 * Data Artikel Edukasi Informasi Kesehatan
 * Ditujukan untuk edukasi kesehatan masyarakat dan pemahaman teknologi medis.
 */

export const HEALTH_CATEGORIES = [
  'Semua',
  'Jantung & ECG',
  'Tekanan Darah',
  'Pencegahan Penyakit',
  'Gaya Hidup Sehat',
  'Kesehatan Dasar',
];

export const HEALTH_ARTICLES = [
  {
    id: 'memahami-pemeriksaan-ecg',
    title: 'Memahami Pemeriksaan Elektrokardiogram (ECG) dan Fungsinya',
    category: 'Jantung & ECG',
    summary:
      'Elektrokardiogram (ECG/EKG) adalah pemeriksaan non-invasif untuk merekam aktivitas listrik jantung dari waktu ke waktu guna mengevaluasi ritme dan konduksi jantung.',
    author: 'Divisi Instrumentasi & Sinyal Biomedis',
    publishedDate: '10 September 2026',
    readTime: '4 menit baca',
    content: [
      {
        heading: 'Apa itu Elektrokardiogram (ECG)?',
        text: 'Elektrokardiogram (ECG atau EKG) adalah tes medis standar yang merekam aktivitas impuls listrik yang dihasilkan oleh otot jantung saat berkontraksi dan berelaksasi. Setiap denyut jantung dipicu oleh impuls listrik yang menjalar melalui jalur konduksi jantung.',
      },
      {
        heading: 'Mengapa Pemeriksaan ECG Diperlukan?',
        text: 'Pemeriksaan ECG membantu tenaga medis dalam mendeteksi berbagai kelainan kardiovaskular, antara lain:\n• Aritmia: Irama detak jantung yang terlalu cepat (takikardia), terlalu lambat (bradikardia), atau tidak beraturan (seperti Fibrilasi Atrium).\n• Iskemia atau Serangan Jantung: Kurangnya aliran darah ke otot jantung.\n• Hipertrofi: Penebalan dinding otot bilik jantung.\n• Evaluasi Efektivitas Obat atau Alat Pacu Jantung.',
      },
      {
        heading: 'Standar Skala Kertas dan Kalibrasi ECG',
        text: 'Hasil rekaman ECG standar dunia menggunakan kecepatan kertas 25 mm/s dan amplitudo tegangan 10 mm/mV. Satu kotak kecil pada kertas grafik ECG merepresentasikan waktu 0,04 detik secara horizontal dan tegangan 0,1 mV secara vertikal.',
      },
      {
        heading: 'Perangkat ECG Portabel Modern',
        text: 'Perkembangan teknologi biomedis memungkinkan perekaman ECG saluran tunggal (single-lead) melalui perangkat portabel klinis seperti OMRON Complete HEM-7530T, memudahkan penapisan awal (screening) ritme jantung di posyandu dan fasilitas kesehatan primer.',
      },
    ],
    references: [
      'American Heart Association (AHA) - Electrocardiogram (ECG or EKG) Guidelines.',
      'Perhimpunan Dokter Spesialis Kardiovaskular Indonesia (PERKI) - Panduan Praktis Interpretasi EKG.',
    ],
    disclaimer:
      'Informasi pada artikel ini ditujukan semata-mata untuk tujuan edukasi kesehatan umum dan pemahaman teknologi biomedis. Artikel ini tidak menggantikan konsultasi, diagnosis, atau penanganan medis langsung oleh dokter spesialis jantung atau tenaga medis profesional.',
  },
  {
    id: 'mengenal-hipertensi-dan-pengukuran-tekanan-darah',
    title: 'Mengenal Hipertensi dan Cara Pengukuran Tekanan Darah yang Akurat',
    category: 'Tekanan Darah',
    summary:
      'Tekanan darah tinggi sering kali tidak menimbulkan gejala awal namun merupakan faktor risiko utama penyakit kardiovaskular. Pahami cara pengukuran yang benar.',
    author: 'Tim Edukasi Kesehatan Komunitas',
    publishedDate: '05 September 2026',
    readTime: '5 menit baca',
    content: [
      {
        heading: 'Memahami Angka Sistolik dan Diastolik',
        text: 'Tekanan darah dituliskan dalam dua angka, misalnya 120/80 mmHg:\n• Angka Atas (Sistolik): Tekanan dalam pembuluh darah arteri saat jantung memompa darah ke seluruh tubuh.\n• Angka Bawah (Diastolik): Tekanan dalam pembuluh darah arteri saat jantung beristirahat di antara denyutan.',
      },
      {
        heading: 'Kategori Tekanan Darah Berdasarkan Pedoman Klinis',
        text: '• Normal: Sistolik < 120 mmHg dan Diastolik < 80 mmHg.\n• Prehipertensi (Meningkat): Sistolik 120–129 mmHg dan Diastolik < 80 mmHg.\n• Hipertensi Derajat 1: Sistolik 130–139 mmHg atau Diastolik 80–89 mmHg.\n• Hipertensi Derajat 2: Sistolik ≥ 140 mmHg atau Diastolik ≥ 90 mmHg.',
      },
      {
        heading: 'Langkah Pengukuran yang Tepat di Klinik / Posyandu',
        text: '1. Pasien duduk tenang dan beristirahat minimal 5 menit sebelum pengukuran.\n2. Hindari merokok, konsumsi kafein, atau aktivitas fisik berat 30 menit sebelum pengukuran.\n3. Pasang manset setinggi posisi jantung dengan ukuran manset yang sesuai lingkar lengan.\n4. Pasien tidak berbicara atau bergerak selama proses inflasi dan deflasi manset.',
      },
    ],
    references: [
      'Kementerian Kesehatan Republik Indonesia - Pedoman Pengendalian Hipertensi.',
      'World Health Organization (WHO) - Global Report on Hypertension.',
    ],
    disclaimer:
      'Informasi pada artikel ini ditujukan untuk edukasi kesehatan. Penentuan diagnosis hipertensi dan peresepan terapi obat harus dilakukan oleh dokter berdasarkan pemeriksaan berulang.',
  },
  {
    id: 'aritmia-dan-fibrilasi-atrium',
    title: 'Aritmia Jantung: Mengenal Fibrilasi Atrium dan Gejala yang Perlu Diwaspadai',
    category: 'Jantung & ECG',
    summary:
      'Fibrilasi Atrium (AFib) adalah salah satu bentuk aritmia paling umum di mana serambi jantung berdenyut secara tidak beraturan dan cepat.',
    author: 'Divisi Riset Sinyal Kardiovaskular',
    publishedDate: '28 Agustus 2026',
    readTime: '4 menit baca',
    content: [
      {
        heading: 'Apa itu Fibrilasi Atrium (AFib)?',
        text: 'Pada kondisi normal, nodus sinoatrialis (SA Node) mengatur irama jantung secara teratur. Pada Fibrilasi Atrium, sinyal listrik di atrium menjadi kacau sehingga atrium bergetar alih-alih berkontraksi secara efektif. Hal ini dapat menyebabkan aliran darah melambat dan membentuk gumpalan darah.',
      },
      {
        heading: 'Gejala yang Sering Dirasakan Pasien',
        text: 'Beberapa pasien tidak merasakan gejala sama sekali (asimtomatik), namun sebagian lainnya mengalami:\n• Palpitasi (jantung berdebar kencang atau tidak teratur).\n• Rasa lelah yang berlebihan atau kelelahan tanpa sebab jelas.\n• Pusing, melayang, atau pingsan ringan.\n• Sesak napas terutama saat beraktivitas fisik ringan.',
      },
      {
        heading: 'Peran Penapisan (Screening) Berkala',
        text: 'Deteksi dini melalui perekaman ECG berkala di posyandu atau fasilitas kesehatan primer sangat krusial, terutama bagi kelompok lansia atau pasien dengan riwayat hipertensi dan diabetes melitus.',
      },
    ],
    references: [
      'European Society of Cardiology (ESC) - Guidelines for the Management of Atrial Fibrillation.',
      'Jurnal Kardiologi Indonesia - Deteksi Dini Aritmia pada Pelayanan Primer.',
    ],
    disclaimer:
      'Hasil pembacaan instan dari perangkat portabel merupakan penapisan awal dan bukan diagnosis definitif. Evaluasi elektrokardiogram lengkap oleh dokter ahli jantung diperlukan untuk menegakkan diagnosis pasti.',
  },
  {
    id: 'pola-hidup-sehat-kardiovaskular',
    title: 'Pilar Gaya Hidup Sehat untuk Menjaga Kesehatan Sistem Kardiovaskular',
    category: 'Gaya Hidup Sehat',
    summary:
      'Pencegahan primer penyakit jantung dapat dicapai melalui modifikasi gaya hidup sehari-hari yang konsisten, teratur, dan terukur.',
    author: 'Tim Promosi Kesehatan Komunitas',
    publishedDate: '20 Agustus 2026',
    readTime: '3 menit baca',
    content: [
      {
        heading: '1. Pola Makan Bergizi Seimbang',
        text: 'Batasi asupan natrium/garam dapur (maksimal 1 sendok teh atau 5 gram garam per hari). Tingkatkan konsumsi serat dari sayuran, buah-buahan, serta kurangi konsumsi lemak jenuh dan lemak trans.',
      },
      {
        heading: '2. Aktivitas Fisik Teratur',
        text: 'Lakukan aktivitas fisik aerobik intensitas sedang minimal 150 menit per minggu, seperti jalan cepat, bersepeda santai, atau berenang selama 30 menit per hari sebanyak 5 hari dalam seminggu.',
      },
      {
        heading: '3. Manajemen Stres dan Istirahat Cukup',
        text: 'Tidur berkualitas 7–8 jam per hari membantu menjaga keseimbangan regulasi tekanan darah dan ritme sirkadian tubuh. Praktikkan relaksasi dan pernapasan dalam saat menghadapi beban mental.',
      },
    ],
    references: [
      'Kemenkes RI - Gerakan Masyarakat Hidup Sehat (GERMAS).',
      'World Heart Federation - Cardiovascular Health Promotion Guidelines.',
    ],
    disclaimer:
      'Konsultasikan dengan dokter sebelum memulai program latihan fisik intensif, terutama bagi individu yang telah memiliki riwayat penyakit jantung sebelumnya.',
  },
];
