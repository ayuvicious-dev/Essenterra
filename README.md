# Essentera

Aplikasi hidup berkelanjutan (sustainable living) untuk pangan dan energi: panduan langkah demi langkah merawat tanaman dan berternak, lengkap dengan progres sampai panen dan pengolahan. Tujuannya mengurangi ketergantungan pada pihak luar dan membangun kemandirian (berdikari).

PWA, bisa dipasang di HP dan dibuka offline. Hosting: GitHub Pages. Backend: Firebase (Authentication, Firestore, Storage).

## Struktur file

```
icons/               ikon PWA dan logo
.nojekyll            supaya GitHub Pages tidak memproses dengan Jekyll
README.md
index.html           SELURUH aplikasi (UI, logika, katalog panduan, konfigurasi Firebase)
manifest.json
service-worker.js    tidak perlu diubah saat revisi
```

**Revisi cukup ganti `index.html`.** Service worker memakai strategi network-first, jadi versi baru langsung terambil saat online.

## Rilis di GitHub Pages

1. Buat repository baru, unggah semua file di atas (termasuk folder `icons` dan `.nojekyll`).
2. Settings > Pages > Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Buka `https://<username>.github.io/<nama-repo>/`.

## Setup Firebase Console (project `essenterra-fad5a`)

1. **Authentication** > Get started > Sign-in method: aktifkan **Google** dan **Email/Password**.
2. **Authentication** > Settings > Authorized domains: tambahkan `<username>.github.io`.
3. **Firestore Database** > Rules, tempel lalu Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tiap pengguna hanya boleh membaca/menulis datanya sendiri
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. **Storage** > Get started, lalu Rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null && request.auth.uid == uid
                   && request.resource.size < 3 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      allow delete: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Jika Storage belum aktif (biasanya butuh paket Blaze), foto otomatis disimpan versi kecil di Firestore sehingga aplikasi tetap jalan.

5. (Disarankan) Google Cloud Console > APIs & Services > Credentials > API key browser: batasi **HTTP referrers** ke `<username>.github.io/*`. API key Firebase untuk web memang publik; keamanan data ada di Rules di atas.

## Struktur data

```
users/{uid}                         profil ringan
users/{uid}/projects/{id}           proyek tanam/ternak/energi (tahap, tugas selesai, panen)
users/{uid}/projects/{id}/logs/{id} jurnal harian + foto
```

## Menambah panduan baru

Edit konstanta `CATALOG` di `index.html`: tambah satu objek berisi `name`, `days`, `unit`, dan daftar `stages` (hari ke-n, deskripsi, tugas). Tahap bertipe `harvest` dan `process` ditandai untuk panen dan pengolahan.
