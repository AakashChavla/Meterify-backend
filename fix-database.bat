@echo off
echo 🔧 Fixing Backend Database Issues...
echo =====================================

cd /d "d:\aakash\gitHub\Meterify-1\Meterify-backend"

echo 📊 Step 1: Generating Prisma Client...
call npx prisma generate

echo 🏗️  Step 2: Running Database Fix Script...
call node fix-database.js

echo ✅ Database setup complete!
echo.
echo 🔄 Please restart your backend server now:
echo    1. Stop the current server (Ctrl+C)
echo    2. Run: npm run start:dev
echo.
pause
