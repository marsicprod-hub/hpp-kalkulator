# HPP Kalkulator

Kalkulator biaya produksi untuk usaha kecil dan rumahan, termasuk makanan seperti donat, kue, dan produk per batch lainnya.

## Fitur

- Hitung hasil produksi berdasarkan berat total adonan dan berat per produk. Produk jadi memakai jumlah utuh; sisa adonan ditampilkan terpisah.
- Hitung biaya bahan adonan berdasarkan harga beli, isi kemasan, satuan pembelian, dan jumlah pemakaian.
- Konversi satuan massa (g/kg), volume (ml/liter), dan jumlah (butir/pcs). Massa, volume, dan jumlah tidak dicampur otomatis karena itu membutuhkan asumsi yang berbeda.
- Hitung overhead per batch, topping per produk, dan kemasan per produk.
- Hitung HPP per produk, harga jual rekomendasi berdasarkan target margin dari harga jual, profit per produk, dan estimasi profit batch.
- Simulasi biaya tetap, titik impas, omzet target, serta estimasi profit target.
- Simpan resep pada browser, cetak ringkasan atau simpan sebagai PDF, salin ringkasan untuk dibagikan, dan ekspor/impor file backup JSON.

## Menjalankan aplikasi

Memerlukan Node.js yang didukung oleh Vite 8.

```bash
npm ci
npm run dev
```

Untuk menguji hasil build produksi:

```bash
npm run build
npm run preview
```

## Catatan perhitungan

- Bahan adonan dan overhead dihitung sebagai biaya untuk satu batch.
- Topping dan kemasan dihitung per produk lalu dikalikan dengan hasil produksi untuk biaya batch.
- Harga jual rekomendasi menggunakan rumus target margin: `HPP / (1 - margin)`, lalu dibulatkan ke atas ke kelipatan Rp100.
- Titik impas menghitung estimasi unit yang dibutuhkan untuk menutup biaya tetap menggunakan selisih harga jual dan HPP/unit.
- Estimasi bukan pembukuan lengkap. Tambahkan biaya yang relevan seperti produk gagal, diskon, pajak, biaya platform, atau ongkos penjualan agar hasil mendekati kondisi usaha sebenarnya.
- Data disimpan di `localStorage` browser pada perangkat saat ini. Gunakan ekspor backup untuk memindahkan atau mengarsipkan data. Ini bukan sinkronisasi cloud.

## Privasi data

Aplikasi berjalan di sisi browser dan tidak memerlukan akun. Data kalkulator dan resep disimpan lokal di browser, kecuali saat pengguna sendiri mengekspor dan membagikan file backup.
