# Roda Hadiah Customer

Website roda hadiah yang dapat di-host gratis melalui GitHub Pages. Pemilihan hadiah, bobot, stok, dan pencatatan customer dijalankan oleh Google Apps Script yang terhubung ke Google Sheets.

## Struktur

- `index.html`, `style.css`, `app.js`: website customer.
- `config.js`: tempat memasukkan URL Google Apps Script.
- `apps-script/Code.gs`: API dan logika pemilihan hadiah.
- `apps-script/appsscript.json`: konfigurasi Apps Script.

## 1. Siapkan Google Sheets dan Apps Script

1. Buat Google Sheets baru.
2. Buka **Extensions > Apps Script**.
3. Salin isi `apps-script/Code.gs` ke file `Code.gs`.
4. Pada Apps Script, jalankan fungsi `setupRoda` satu kali dan izinkan akses.
5. Kembali ke Google Sheets. Tab `Hadiah` dan `Hasil Putaran` akan dibuat otomatis.
6. Atur hadiah, bobot, stok, status aktif, dan warna pada tab `Hadiah`.

Kolom `Bobot` menentukan peluang relatif. Contoh bobot `10` dua kali lebih mungkin dipilih dibanding bobot `5`.

## 2. Deploy Google Apps Script

1. Di Apps Script klik **Deploy > New deployment**.
2. Pilih tipe **Web app**.
3. `Execute as`: **Me**.
4. `Who has access`: **Anyone**.
5. Klik **Deploy**, lalu salin URL yang berakhiran `/exec`.
6. Buka `config.js` dan ganti:

```js
apiUrl: "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE"
```

dengan URL deployment tersebut.

Setiap kali kode Apps Script diubah, buat deployment versi baru melalui **Deploy > Manage deployments > Edit**.

## 3. Upload ke GitHub

Jalankan perintah berikut dari dalam folder proyek:

```bash
git init
git add .
git commit -m "Buat website roda hadiah"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPOSITORY.git
git push -u origin main
```

## 4. Aktifkan GitHub Pages

1. Buka repository di GitHub.
2. Masuk ke **Settings > Pages**.
3. Pada **Build and deployment**, pilih **Deploy from a branch**.
4. Pilih branch `main` dan folder `/ (root)`, lalu klik **Save**.
5. Website akan tersedia di `https://USERNAME.github.io/NAMA-REPOSITORY/`.

## Pengamanan yang Sudah Disertakan

- Hasil hadiah dipilih oleh Apps Script, bukan browser.
- Bobot hadiah tidak dikirim ke browser.
- Satu kontak hanya bisa melakukan satu putaran.
- `LockService` mencegah stok hadiah digunakan bersamaan oleh beberapa customer.
- Setiap pemenang memperoleh kode klaim unik.

Pembatasan berdasarkan kontak masih dapat dilewati dengan memakai kontak berbeda. Untuk hadiah bernilai tinggi, tambahkan verifikasi OTP dan backend dengan autentikasi.
