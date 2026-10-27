#!/bin/bash
# Setup script untuk Kahuripan Tani

echo "🚀 Kahuripan Tani - Setup Script"
echo "================================"
echo ""

# Install PHP dependencies
echo "📦 Installing PHP dependencies..."
composer install --no-interaction

# Generate app key
echo "🔐 Generating app key..."
php artisan key:generate

# Clear caches
echo "🧹 Clearing caches..."
php artisan config:cache
php artisan cache:clear

# Run migrations
echo "📊 Running database migrations..."
php artisan migrate --force

# Seed database
echo "🌱 Seeding database..."
php artisan db:seed --no-interaction

# Install npm dependencies
echo "📚 Installing npm dependencies..."
npm install

# Build frontend assets
echo "🎨 Building frontend assets..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Start the Laravel server: php artisan serve"
echo "2. In a new terminal, start Vite dev server: npm run dev"
echo "3. Open http://localhost:5173 in your browser"
echo ""
echo "🔑 Test Login Credentials:"
echo "   Owner: owner@retailpos.local / password123"
echo "   Admin: admin@retailpos.local / password123"
echo "   Employee: kasir1@retailpos.local / password123"
