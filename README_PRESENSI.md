# 📱 Sistem Presensi Karyawan Modern

Website presensi karyawan yang dibangun dengan **Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui**, dilengkapi dengan fitur kamera untuk face detection dan export data Excel.

## ✨ Fitur Utama

### 1. **Autentikasi & Login**
- ✅ Form login modern dengan validasi
- ✅ Session management dengan localStorage
- ✅ Demo credentials untuk testing
- ✅ Role-based access control (Karyawan & Admin)

### 2. **Dashboard Karyawan**
- 📍 **Presensi Masuk/Pulang** - Tombol besar dengan gradient, modal kamera
- 📋 Riwayat presensi - Tabel dengan filter bulan & pencarian
- 🎯 Pengajuan Izin/Cuti - Form pengajuan + riwayat status
- 👤 Profil - Data diri karyawan
- ⏰ Clock widget real-time dengan tanggal

### 3. **Camera Detection (Mock)**
- 📷 Modal fullscreen dengan live camera feed (getUserMedia API)
- 🔲 Oval frame guide untuk positioning wajah
- 🟢 Simulasi face detection (TODO: integrasi face-api.js atau TensorFlow.js)
- ✓ Konfirmasi sukses dengan timestamp
- 📸 Capture preview sebelum submit

### 4. **Dashboard Admin**
- 📊 Rekap presensi semua karyawan
- 🔍 Filter by bulan & nama karyawan
- 📈 Statistik ringkas (Hadir, Telat, Izin, Alpha)
- 📥 Tombol "Export Excel" (UI ready, TODO: integrasi xlsx/sheetjs)
- 👥 Tabel komprehensif dengan sortir dan pagination

### 5. **UI/UX Modern**
- 📱 **Fully Responsive** - Desktop & mobile (hamburger menu)
- 🎨 Clean gradient design - Indigo (primary) + neutral colors
- ✨ Smooth transitions & hover effects
- 🌙 Dark mode ready (Tailwind v4 theme)
- ♿ Semantic HTML & accessible components

## 📁 Struktur Folder

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx         # Halaman login
│   └── layout.tsx
├── (dashboard)/
│   ├── layout.tsx           # Dashboard wrapper + Topbar
│   ├── dashboard/
│   │   └── page.tsx         # Dashboard karyawan
│   ├── riwayat/
│   │   └── page.tsx         # Riwayat presensi
│   ├── izin/
│   │   └── page.tsx         # Pengajuan izin
│   ├── profile/
│   │   └── page.tsx         # Profil karyawan
│   └── admin/
│       ├── layout.tsx       # Admin protection
│       └── rekap/
│           └── page.tsx     # Rekap presensi admin
├── page.tsx                 # Root redirect
├── layout.tsx               # Root layout dengan AuthProvider
└── globals.css              # Tailwind v4 config

components/
├── topbar.tsx               # Navigation bar desktop & mobile
├── clock-widget.tsx         # Real-time clock
├── attendance-camera.tsx    # Modal kamera untuk presensi
└── ui/                      # shadcn/ui components
    └── button.tsx

lib/
├── auth-context.tsx         # Auth provider & hooks
└── mock-data.ts             # Data dummy untuk development
```

## 🔐 Demo Credentials

| Role     | Email                | Password    |
| -------- | -------------------- | ----------- |
| Karyawan | budi@example.com     | password123 |
| Karyawan | siti@example.com     | password123 |
| Admin    | admin@example.com    | admin123    |

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Dev Server
```bash
pnpm dev
```
Aplikasi akan berjalan di `http://localhost:3000`

### 3. Login
- Gunakan salah satu demo credentials di atas
- Karyawan akan diarahkan ke dashboard mereka
- Admin akan diarahkan ke dashboard rekap presensi

## 🎯 Fitur yang Sudah Diimplementasikan

### ✅ Completed
- [x] Struktur folder rapi dengan grouped routes
- [x] Authentication & session management
- [x] Dashboard karyawan dengan 2 tombol utama
- [x] Modal kamera dengan face detection simulasi
- [x] Riwayat presensi dengan tabel & filter
- [x] Form pengajuan izin/cuti
- [x] Profil karyawan
- [x] Dashboard admin dengan statistik
- [x] Topbar navigasi (desktop & mobile hamburger)
- [x] Responsive design mobile-first
- [x] Mock data dengan seed karyawan & presensi
- [x] Real-time clock widget
- [x] Beautiful gradient design
- [x] Loading states & transitions

### 🚧 Todo (Next Steps)

#### **Integrasi Face Detection**
```javascript
// TODO: Integrate face-api.js atau TensorFlow.js
// File: components/attendance-camera.tsx (line ~80)
// Ganti simulasi random dengan real face detection model loading
```

#### **Export Excel**
```javascript
// TODO: Install & setup xlsx/sheetjs library
// pnpm add xlsx
// File: app/(dashboard)/admin/rekap/page.tsx (line ~180)
// Implement Excel generation dengan data dinamis
```

#### **Database Integration** (Optional)
```javascript
// TODO: Ganti mock-data dengan real database
// - Neon PostgreSQL + Drizzle ORM
// - Atau Supabase + realtime
// - Create proper migrations & schemas
```

#### **Production Ready**
- [ ] Add error boundaries
- [ ] Implement proper error handling
- [ ] Add loading skeletons
- [ ] Pagination untuk tabel besar
- [ ] Form validation dengan zod/yup
- [ ] Unit tests
- [ ] E2E tests dengan playwright
- [ ] Deployment to Vercel

## 🛠️ Technology Stack

| Layer      | Technology                           |
| ---------- | ------------------------------------ |
| Framework  | Next.js 16 (App Router)              |
| Language   | TypeScript                           |
| Styling    | Tailwind CSS v4                      |
| UI Library | shadcn/ui                            |
| Icons      | lucide-react                         |
| Storage    | localStorage (mock - session only)   |
| Camera API | getUserMedia (browser native)        |

## 📐 Component Architecture

### Client Components
- `LoginPage` - Form dengan validasi
- `Topbar` - Navigation dengan mobile menu
- `ClockWidget` - Real-time jam & tanggal
- `AttendanceCamera` - Modal kamera fullscreen
- Dashboard pages - State management untuk attendance

### Server Components
- Layout wrappers untuk routing groups
- Page routes untuk SEO

### Context & Hooks
- `AuthContext` - Centralized auth state
- `useAuth()` - Hook untuk akses user data

## 🎨 Design System

### Color Palette
- **Primary**: Indigo (600-700) - Aksi utama, tombol
- **Success**: Emerald (500-600) - Status hadir, approved
- **Warning**: Amber (500-600) - Status telat, pending
- **Info**: Blue (500-600) - Status izin
- **Danger**: Red (600-700) - Status alpha, rejected
- **Neutral**: Slate (50-900) - Backgrounds, text

### Typography
- **Headings**: Bold (700-800)
- **Body**: Regular (400-500)
- **UI Text**: Medium (500-600)
- **Captions**: Regular (400), muted color

### Spacing & Radius
- Base spacing: 4px scale (p-4 = 1rem)
- Border radius: rounded-xl (default), rounded-2xl (cards)

## 🔄 Data Flow

```
User Login
    ↓
AuthProvider (localStorage)
    ↓
useAuth() hook
    ↓
Dashboard / Admin Rekap
    ↓
Mock Data (mockAttendance, mockEmployees, mockPermissions)
    ↓
Rendered UI
```

## 📱 Responsive Behavior

- **Mobile** (< 768px)
  - Hamburger menu di topbar
  - Single column layout
  - Full-width cards
  
- **Tablet** (768px - 1024px)
  - Grid 2 kolom untuk beberapa sections
  
- **Desktop** (> 1024px)
  - Grid multi-kolom
  - Sidebar-ready (untuk future)
  - Full horizontal navigation

## 🐛 Known Issues & Notes

1. **Face Detection (Mock)**
   - Saat ini menggunakan random simulation
   - Untuk production: integrasikan face-api.js atau TensorFlow.js
   - Tutorial: https://github.com/justadudewhohacks/face-api.js

2. **Excel Export (UI Ready)**
   - Button sudah ada tapi belum functional
   - TODO: Install `xlsx` dan setup export handler
   - Reference: https://github.com/SheetJS/sheetjs

3. **Session Persistence**
   - Menggunakan localStorage (bukan production-ready)
   - Untuk production: gunakan server sessions + JWT

## 💡 Tips untuk Development

### Menambah Halaman Baru
```bash
# 1. Buat folder di app/(dashboard)/
mkdir -p app/(dashboard)/feature-name

# 2. Buat page.tsx dengan 'use client' jika state needed
cat > app/(dashboard)/feature-name/page.tsx << 'EOF'
'use client';
import { useAuth } from '@/lib/auth-context';

export default function FeaturePage() {
  const { user } = useAuth();
  return <div>Feature content</div>;
}
EOF

# 3. Import di topbar.tsx untuk add menu item
```

### Menambah Component
```bash
# Selalu buat di components/ folder
cat > components/my-component.tsx << 'EOF'
'use client'; // jika state needed

import { Button } from '@/components/ui/button';

export function MyComponent() {
  return <div>My component</div>;
}
EOF
```

### Testing Login Flow
1. Buka http://localhost:3000
2. Login dengan `budi@example.com / password123`
3. Test navigasi antar halaman
4. Buka DevTools → Application → localStorage untuk lihat session

## 📚 Useful References

- [Next.js 16 Docs](https://nextjs.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [lucide-react Icons](https://lucide.dev)
- [face-api.js](https://github.com/justadudewhohacks/face-api.js)
- [SheetJS (Excel)](https://sheetjs.com)

## 📝 License

Built for demonstration purposes.

---

**Happy coding! 🎉**
