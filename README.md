<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

# 📝 CuyNotes

> Full-stack Notes Application dengan fitur proteksi password, visibilitas catatan, **Super Admin dashboard**, dan manajemen pengguna — dibangun menggunakan **Next.js**, **Flask**, **MySQL**, dan **Docker**.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🔐 **Autentikasi** | Register & Login menggunakan JWT Authentication |
| 📝 **CRUD Notes** | Buat, baca, edit, dan hapus catatan |
| 👁️ **Visibilitas** | Atur catatan sebagai **Public**, **Private**, atau **Protected** |
| 🛡️ **Password Protection** | Catatan protected memerlukan password untuk dilihat |
| 🔄 **Verifikasi Ganda** | Ubah password protected memerlukan password lama + password akun |
| ⭐ **Favorites** | Tandai catatan favorit untuk akses cepat |
| 🔍 **Search** | Cari catatan berdasarkan judul atau isi |
| 👤 **Profile** | Kelola profil dan ubah password akun |
| 📱 **Responsive** | Tampilan responsif untuk desktop dan mobile |
| 🛡️ **Super Admin** | Dashboard admin untuk mengelola semua user & notes |
| 🚫 **Ban/Unban User** | Admin bisa memblokir dan membuka blokir akun user |
| 📊 **Admin Dashboard** | Statistik overview (total user, notes, banned users) |

---

## 🏗️ Arsitektur

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│   Database   │
│   Next.js    │     │  Flask API   │     │  MySQL 8.0   │
│  Port: 3000  │     │  Port: 5001  │     │  Port: 3306  │
└──────────────┘     └──────────────┘     └──────────────┘
        │                    │                    │
        └────────────────────┴────────────────────┘
                    Docker Network
                  (cuynotes_network)
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** — React framework dengan App Router
- **React 19** — UI component library
- **Tailwind CSS** — Utility-first CSS framework

### Backend
- **Flask** — Python micro web framework
- **SQLAlchemy** — ORM untuk database
- **PyJWT** — JSON Web Token authentication
- **bcrypt** — Password hashing
- **Gunicorn** — WSGI HTTP server

### Database & Infrastructure
- **MySQL 8.0** — Relational database
- **Docker & Docker Compose** — Containerization & orchestration

---

## 🚀 Quick Start

Pastikan [Docker](https://www.docker.com/products/docker-desktop/) sudah terinstall di komputer kamu.

```bash
# 1. Clone repository
git clone https://github.com/yuwancornelius/notes-app.git
cd notes-app

# 2. Setup environment files
cp backend/.env.example backend/.env
cp client/.env.example client/.env

# 3. Build dan jalankan
docker compose up --build -d

# ✅ Buka browser → http://localhost:3000
```

> **Note:** Proses build pertama kali memakan waktu ±3-5 menit untuk download dependencies.

---

## 📁 Struktur Project

```
notes-app/
├── docker-compose.yml          # Docker orchestration (dev)
├── docker-compose.prod.yml     # Docker orchestration (production)
├── aapanel-docker-guide.html   # Panduan deployment aaPanel + Docker
│
├── backend/                    # Flask Backend
│   ├── Dockerfile
│   ├── .env.example            # Template environment
│   ├── main.py                 # Entry point
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py         # App factory
│       ├── config.py           # Configuration
│       ├── models/             # Database models
│       │   ├── user.py         # User model (role, ban status)
│       │   ├── note.py
│       │   └── favorite.py
│       ├── routes/             # API endpoints
│       │   ├── auth.py         # Auth routes
│       │   ├── notes.py        # Notes CRUD
│       │   ├── favorites.py    # Favorites toggle
│       │   └── admin.py        # 🛡️ Super Admin routes
│       ├── utils/              # JWT helpers, admin decorator
│       └── services/           # Business logic
│
└── client/                     # Next.js Frontend
    ├── Dockerfile
    ├── .env.example            # Template environment
    ├── package.json
    └── src/
        ├── app/                # Pages (App Router)
        │   └── admin/          # 🛡️ Admin pages
        │       ├── layout.js   # Admin auth guard
        │       ├── page.js     # Dashboard
        │       ├── users/      # Kelola user
        │       └── notes/      # Kelola notes
        ├── components/         # React components
        ├── services/           # API service
        ├── store/              # Auth context
        └── utils/              # Utilities
```

---

## ⚙️ Konfigurasi Environment

### Backend (`backend/.env`)

| Variable | Deskripsi | Default |
|----------|-----------|---------|
| `FLASK_APP` | Entry point Flask | `main.py` |
| `FLASK_ENV` | Mode environment | `development` |
| `SECRET_KEY` | Secret key untuk Flask session | *(ganti untuk production)* |
| `JWT_SECRET_KEY` | Secret key untuk JWT token | *(ganti untuk production)* |
| `DATABASE_URL` | Connection string MySQL | `mysql+pymysql://notes_user:notes_password@cuynotes_db:3306/cuynotes` |
| `SUPER_ADMIN_EMAIL` | Email login Super Admin | `superadmin@cuynotes.com` |
| `SUPER_ADMIN_PASSWORD` | Password login Super Admin | `SuperAdmin@2026` |

### Frontend (`client/.env`)

| Variable | Deskripsi | Default |
|----------|-----------|---------|
| `NEXT_PUBLIC_API_URL` | URL backend API | `http://localhost:5001/api` |

> ⚠️ Jika deploy ke server remote, ganti `localhost` di `NEXT_PUBLIC_API_URL` dengan IP server kamu.

---

## 🐳 Docker Services

| Service | Container | Port | Image |
|---------|-----------|------|-------|
| **Frontend** | `frontend_nextjs` | `3000` | Node 20 Slim |
| **Backend** | `backend_flask` | `5001` | Python 3.11 Slim |
| **Database** | `cuynotes_db` | `3306` | MySQL 8.0 |

### Perintah Yang Sering Digunakan

```bash
# Start semua container
docker compose up -d

# Stop semua container
docker compose down

# Rebuild dan restart
docker compose up --build -d

# Lihat logs
docker compose logs -f

# Akses MySQL
docker exec -it cuynotes_db mysql -u notes_user -pnotes_password cuynotes
```

---

## 🗄️ Database Schema

### Tabel `users`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | INT (PK) | Primary key |
| `username` | VARCHAR | Username unik |
| `email` | VARCHAR | Email unik |
| `password_hash` | VARCHAR | Hash password (bcrypt) |
| `avatar` | VARCHAR | URL avatar (opsional) |
| `role` | VARCHAR | `user` atau `superadmin` |
| `is_banned` | BOOLEAN | Status banned (default: `false`) |
| `security_question` | VARCHAR | Pertanyaan keamanan |
| `security_answer_hash` | VARCHAR | Hash jawaban keamanan |
| `created_at` | DATETIME | Tanggal registrasi |

### Tabel `notes`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | INT (PK) | Primary key |
| `title` | VARCHAR | Judul catatan |
| `content` | TEXT | Isi catatan |
| `visibility` | ENUM | `public`, `private`, `protected` |
| `password_hash` | VARCHAR | Hash password (untuk protected) |
| `user_id` | INT (FK) | Foreign key ke users |
| `created_at` | DATETIME | Tanggal dibuat |
| `updated_at` | DATETIME | Tanggal terakhir diubah |

### Tabel `favorites`
| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | INT (PK) | Primary key |
| `user_id` | INT (FK) | Foreign key ke users |
| `note_id` | INT (FK) | Foreign key ke notes |

---

## 📖 API Endpoints

### Authentication
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/auth/register` | Registrasi user baru |
| `POST` | `/api/auth/login` | Login dan dapatkan JWT token |
| `GET` | `/api/auth/me` | Lihat profil user |
| `PUT` | `/api/auth/me` | Update profil user |

### Notes
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/notes` | Ambil semua notes (public) |
| `GET` | `/api/notes/my` | Ambil notes milik user |
| `POST` | `/api/notes` | Buat note baru |
| `GET` | `/api/notes/:id` | Lihat detail note |
| `PUT` | `/api/notes/:id` | Update note |
| `DELETE` | `/api/notes/:id` | Hapus note |
| `POST` | `/api/notes/:id/verify-password` | Verifikasi password note |

### Favorites
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/favorites` | Ambil daftar favorit |
| `POST` | `/api/favorites/:id` | Toggle favorit |

### 🛡️ Super Admin
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/admin/stats` | Dashboard statistik |
| `GET` | `/api/admin/users` | List semua user (pagination + search) |
| `GET` | `/api/admin/users/:id` | Detail user |
| `PUT` | `/api/admin/users/:id` | Edit user |
| `DELETE` | `/api/admin/users/:id` | Hapus user + semua notes-nya |
| `POST` | `/api/admin/users/:id/ban` | Ban user |
| `POST` | `/api/admin/users/:id/unban` | Unban user |
| `GET` | `/api/admin/notes` | List semua notes |
| `GET` | `/api/admin/notes/:id` | Detail note (bypass password) |
| `PUT` | `/api/admin/notes/:id` | Edit note |
| `DELETE` | `/api/admin/notes/:id` | Hapus note |

---

## 🛡️ Super Admin

CuyNotes memiliki fitur **Super Admin** untuk mengelola seluruh platform.

### Login
| Field | Nilai |
|-------|-------|
| **Email** | Sesuai env `SUPER_ADMIN_EMAIL` (default: `superadmin@cuynotes.com`) |
| **Password** | Sesuai env `SUPER_ADMIN_PASSWORD` (default: `SuperAdmin@2026`) |
| **Dashboard** | `http://localhost:3000/admin` |

### Fitur Admin
- 📊 **Dashboard** — Statistik total user, notes, banned users, notes per visibilitas
- 👥 **Kelola User** — Edit profil, reset password, hapus user (+ semua notes), ban/unban
- 📝 **Kelola Notes** — Lihat, edit, hapus semua notes (bypass private/protected)

> 💡 Super Admin menggunakan credential dari environment variable, bukan database. Akun admin tidak bisa di-ban atau dihapus.

---

## 📋 Deployment Guide

Untuk panduan deployment lengkap ke VPS menggunakan aaPanel + Docker, buka file **`aapanel-docker-guide.html`** di browser kamu.

> **Penting untuk update dari versi lama:** Jika sudah punya database sebelumnya, jalankan migrasi:
> ```bash
> docker exec -i cuynotes_db mysql -u notes_user -pnotes_password cuynotes -e "
>   ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user' AFTER avatar;
>   ALTER TABLE users ADD COLUMN is_banned BOOLEAN NOT NULL DEFAULT FALSE AFTER role;
> "
> ```

---

## 🤝 Author

**Yuwan Cornelius**

---

<p align="center">
  Built with ❤️ using Next.js + Flask + MySQL + Docker
</p>
