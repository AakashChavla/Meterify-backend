@echo off

REM Meterify Development Setup Script for Windows

echo 🚀 Setting up Meterify development environment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL is not installed. Please install PostgreSQL first.
    echo    You can also use Docker: docker run --name meterify-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Copy environment file
if not exist .env (
    echo 📄 Creating .env file...
    copy .env.example .env
    echo ✅ Created .env file. Please update the DATABASE_URL and other settings.
) else (
    echo ✅ .env file already exists.
)

REM Generate Prisma client
echo 🔧 Generating Prisma client...
npx prisma generate

REM Run database migrations
echo 🗄️  Running database migrations...
npx prisma migrate dev --name init

REM Seed the database
echo 🌱 Seeding database...
npm run db:seed

echo ✅ Development environment setup complete!
echo.
echo 🎉 Next steps:
echo    1. Update your .env file with the correct database connection
echo    2. Run 'npm run start:dev' to start the development server
echo    3. Visit http://localhost:3000/docs to see the API documentation
echo    4. Use the admin credentials: admin@meterify.com / admin123
echo.
echo 💡 Useful commands:
echo    - npm run start:dev    # Start development server
echo    - npm run start:prod   # Start production server
echo    - npm run prisma:studio # Open Prisma Studio
echo    - npm test             # Run tests

pause
