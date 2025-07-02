#!/bin/bash

# Meterify Development Setup Script

echo "🚀 Setting up Meterify development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   You can also use Docker: docker run --name meterify-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo "📄 Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file. Please update the DATABASE_URL and other settings."
else
    echo "✅ .env file already exists."
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

# Seed the database
echo "🌱 Seeding database..."
npm run db:seed

echo "✅ Development environment setup complete!"
echo ""
echo "🎉 Next steps:"
echo "   1. Update your .env file with the correct database connection"
echo "   2. Run 'npm run start:dev' to start the development server"
echo "   3. Visit http://localhost:3000/docs to see the API documentation"
echo "   4. Use the admin credentials: admin@meterify.com / admin123"
echo ""
echo "💡 Useful commands:"
echo "   - npm run start:dev    # Start development server"
echo "   - npm run start:prod   # Start production server"
echo "   - npm run prisma:studio # Open Prisma Studio"
echo "   - npm test             # Run tests"
