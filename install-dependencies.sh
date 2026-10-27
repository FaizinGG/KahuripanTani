#!/bin/bash
# Installation Script untuk RetailPOS
# Jalankan script ini untuk setup dependencies yang sudah diperbaiki

echo "========================================="
echo "RetailPOS Dependency Installation"
echo "========================================="
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js tidak terinstall!"
    echo "   Download dari: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js harus v18 atau lebih tinggi (saat ini: $(node --version))"
    exit 1
fi
echo "   Node.js $(node --version) ✅"

# Check NPM
echo "✓ Checking NPM..."
if ! command -v npm &> /dev/null; then
    echo "❌ NPM tidak terinstall!"
    exit 1
fi
echo "   NPM $(npm --version) ✅"
echo ""

# Navigate to project
echo "✓ Navigating to project..."
cd "$(dirname "$0")" || exit 1
echo "   Project path: $(pwd)"
echo ""

# Clean previous installation
echo "✓ Cleaning previous installation..."
if [ -d "node_modules" ]; then
    echo "   Removing node_modules..."
    rm -rf node_modules
fi
if [ -f "package-lock.json" ]; then
    echo "   Removing package-lock.json..."
    rm package-lock.json
fi
echo ""

# Clear NPM cache
echo "✓ Clearing NPM cache..."
npm cache clean --force > /dev/null 2>&1
echo "   Cache cleared ✅"
echo ""

# Install dependencies
echo "✓ Installing dependencies..."
echo "   This may take 2-5 minutes..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Installation failed!"
    exit 1
fi
echo "   Dependencies installed ✅"
echo ""

# Verify installation
echo "✓ Verifying installation..."
npm list --depth=0 | head -20
echo ""

# Test build
echo "✓ Testing build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   Build test passed ✅"
else
    echo "   Build test failed ⚠️"
fi
echo ""

# Done
echo "========================================="
echo "✅ Installation completed successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Terminal 1: php artisan serve"
echo "2. Terminal 2: npm run dev"
echo "3. Open: http://localhost:5173"
echo ""
echo "Happy coding! 🚀"
