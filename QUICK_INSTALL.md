# ⚡ Quick Installation Guide

## 🔍 Masalah yang Sudah Diperbaiki

### ✅ Fixed Issues
1. ✅ `js-barcode` → Diganti dengan `jsbarcode` (package yang valid)
2. ✅ `lucide-react 0.344.0` → Diupdate ke `0.395.0` (support React 19)
3. ✅ `recharts 2.10.0` → Diupdate ke `2.12.0` (support React 19)
4. ✅ `@tailwindcss/forms 0.5.0` → Diupdate ke `0.7.0` (support Tailwind 4)
5. ✅ `@tailwindcss/typography 0.5.0` → Diupdate ke `0.7.0` (support Tailwind 4)
6. ✅ `@vitejs/plugin-react 4.2.0` → Diupdate ke `5.0.0` (support Vite 8)
7. ✅ `shadcn-ui` → Dihapus (tidak diperlukan, component library custom sudah ada)

---

## 🚀 Installation Steps

### **Prerequisite**
- Node.js v18+ (Download dari https://nodejs.org/)
- NPM v10+

### **Step 1: Open PowerShell / Terminal**
```powershell
cd "c:\Users\faizi\OneDrive\Documents\Kuliah\S6\KP\kahuripantanipos"
```

### **Step 2: Clean Previous Installation (Jika ada)**
```powershell
# Remove node_modules
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Remove package-lock.json
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Clear NPM cache
npm cache clean --force
```

### **Step 3: Install Dependencies**
```powershell
npm install
```
**Waktu:** ~2-5 menit tergantung internet speed

### **Step 4: Verify Installation**
```powershell
npm list --depth=0
```
Harus menampilkan semua packages tanpa error.

### **Step 5: Test Build**
```powershell
npm run build
```
Jika berhasil tanpa error → Dependencies valid! ✅

---

## 🎯 Starting the Application

### **Terminal 1 - Backend (Port 8000)**
```powershell
php artisan serve
```

### **Terminal 2 - Frontend (Port 5173)**
```powershell
npm run dev
```

### **Browser**
```
http://localhost:5173
```

### **Login Credentials**
```
Email:    owner@retailpos.local
Password: password123
```

---

## 📊 Installation Status Checklist

After running `npm install`:

- [ ] Command berhasil tanpa error
- [ ] `node_modules` folder tercipta (~500MB+)
- [ ] `package-lock.json` tercipta
- [ ] `npm run build` berhasil
- [ ] `npm run dev` dapat start dev server
- [ ] Browser akses `http://localhost:5173` berhasil
- [ ] Login bisa dengan credentials di atas
- [ ] Dashboard menampilkan data

---

## 🆘 Troubleshooting

### Error: `npm: command not found`
```
→ Node.js belum terinstall
→ Download dari https://nodejs.org/
→ Restart PowerShell setelah install
```

### Error: `ETARGET` atau `404 Not Found`
```
→ Berarti masih pakai package.json yang lama
→ Pastikan sudah edit package.json sesuai instruksi
→ Delete node_modules dan package-lock.json
→ Jalankan npm install lagi
```

### Error: `vite: command not found`
```
→ Dependencies belum terinstall
→ Jalankan: npm install
```

### Error saat `npm run dev`
```
→ Cek apakah port 5173 sudah terpakai
→ Atau bisa jalankan di port lain:
   npm run dev -- --port 3000
```

### Build error (vite/react compatibility)
```
→ Berarti package.json tidak sesuai
→ Pastikan sudah benar:
  - "@vitejs/plugin-react": "^5.0.0"
  - "vite": "^8.0.0"
  - "lucide-react": "^0.395.0"
```

---

## 📝 Verification Commands

Sebelum mulai develop, jalankan commands ini:

```powershell
# 1. Check Node version
node --version
# Expected: v18.0.0 atau lebih tinggi

# 2. Check NPM version
npm --version
# Expected: v10.0.0 atau lebih tinggi

# 3. List all installed packages
npm list --depth=0

# 4. Check untuk outdated packages
npm outdated

# 5. Test build
npm run build

# 6. Start dev server
npm run dev
```

---

## 💾 Automated Installation (Optional)

### Windows PowerShell
Jalankan script yang sudah disediakan:
```powershell
.\install-dependencies.bat
```

### Linux/Mac
```bash
bash install-dependencies.sh
```

Scripts ini akan otomatis:
1. Check Node.js dan NPM
2. Clean previous installation
3. Clear NPM cache
4. Install dependencies
5. Test build
6. Show next steps

---

## 📂 Project Structure After Installation

```
project/
├── node_modules/           ← Dependencies (auto-created, ~600MB)
├── package.json            ← ✅ FIXED
├── package-lock.json       ← ✅ Auto-generated
├── resources/
│   └── js/
│       ├── components/
│       ├── pages/
│       └── App.jsx
├── vite.config.js
├── tailwind.config.js
└── [other files...]
```

---

## 🎯 Summary

| Item | Status | Details |
|------|--------|---------|
| package.json | ✅ FIXED | Semua dependencies compatible |
| React 19 | ✅ OK | lucide-react, recharts updated |
| Vite 8 | ✅ OK | @vitejs/plugin-react v5.0 |
| Tailwind 4 | ✅ OK | Forms & typography updated |
| jsbarcode | ✅ OK | js-barcode diganti jsbarcode |
| Installation | ✅ READY | Siap untuk npm install |

---

## ✨ Ready!

```powershell
cd "c:\Users\faizi\OneDrive\Documents\Kuliah\S6\KP\kahuripantanipos"
npm install
npm run dev
```

**That's it! 🚀**

Happy coding! 💻
