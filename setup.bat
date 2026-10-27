@echo off
REM Setup script untuk Kahuripan Tani (Windows)

echo.
echo 🚀 Kahuripan Tani - Windows Setup Script
echo ========================================
echo.

echo 📦 Installing PHP dependencies...
call composer install --no-interaction

echo.
echo 🔐 Generating app key...
cmd /c php artisan key:generate

echo.
echo 🧹 Clearing caches...
cmd /c php artisan config:cache
cmd /c php artisan cache:clear

echo.
echo 📊 Running database migrations...
cmd /c php artisan migrate --force

echo.
echo 🌱 Seeding database...
cmd /c php artisan db:seed --no-interaction

echo.
echo 📚 Installing npm dependencies...
call npm install

echo.
echo 🎨 Building frontend assets...
call npm run build

echo.
echo ✅ Setup complete!
echo.
echo 📝 Next steps:
echo 1. Start the Laravel server: php artisan serve
echo 2. In a new terminal, start Vite dev server: npm run dev
echo 3. Open http://localhost:5173 in your browser
echo.
echo 🔑 Test Login Credentials:
echo    Owner: owner@retailpos.local / password123
echo    Admin: admin@retailpos.local / password123
echo    Employee: kasir1@retailpos.local / password123
echo.
pause
