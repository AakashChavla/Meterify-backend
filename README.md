# Meterify

> **API Usage Tracking, Rate Limiting, Billing Automation with Payment Integration & Notifications**

Meterify is a comprehensive backend solution designed for API providers (SaaS startups, indie developers) to track API usage, implement per-user rate limiting, calculate bills based on usage, automate monthly invoicing, and handle payments seamlessly.

## 🚀 Features

### ✅ Phase 1 (MVP - Completed)
- ✅ **User Management**: API key-based authentication for users
- ✅ **Usage Tracking**: Comprehensive API usage logging with metrics
- ✅ **Rate Limiting**: Per-user configurable rate limits with automatic enforcement
- ✅ **Billing System**: Automated monthly bill calculation and invoice generation
- ✅ **Admin Dashboard**: Complete admin API for monitoring and management
- ✅ **Analytics**: Detailed usage analytics and system health monitoring
- ✅ **Pricing Tiers**: Flexible pricing tier management system

### ✅ Phase 2 (Payment Integration - Completed)
- ✅ **Payment Processing**: Razorpay integration for seamless payments
- ✅ **Email Notifications**: Automated email notifications with HTML templates
- ✅ **PDF Generation**: Generate professional PDF invoices
- ✅ **Health Monitoring**: Real-time health checks for all third-party services
- ✅ **TDD Implementation**: Comprehensive test coverage for all features

### 🚧 Phase 3 (Advanced Features - Planned)
- � **Advanced Analytics**: Real-time dashboards and ML-powered insights
- 🏢 **Enterprise Features**: Multi-tenant architecture and white-label solutions
- � **Mobile SDK**: Native mobile app integration
- 🤖 **AI Features**: Usage anomaly detection and predictive analytics
- 🌐 **Frontend Dashboard**: React-based admin and user dashboards
- 🔒 **Advanced Security**: OAuth2, SAML, and compliance features

## 🛠️ Tech Stack

- **Backend**: NestJS (TypeScript)
- **Database**: SQLite with Prisma ORM (PostgreSQL for production)
- **Authentication**: JWT for admin, API keys for users
- **Payment Gateway**: Razorpay integration
- **Email Service**: Nodemailer with SMTP
- **PDF Generation**: Puppeteer for invoice PDFs
- **Notifications**: HTML email templates with MJML
- **Health Monitoring**: Automated third-party service health checks
- **Testing**: Jest with comprehensive TDD coverage
- **Documentation**: Swagger/OpenAPI 3.0
- **Logging**: Winston with structured logging
- **Scheduling**: Built-in cron jobs for automated tasks

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- SQLite (for development) / PostgreSQL (for production)
- SMTP credentials (for email notifications)
- Razorpay account (for payment processing)
- Docker (optional, for containerized deployment)

## 🚀 Quick Start

### 📋 Prerequisites Check
Before starting, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- Git for version control
- Code editor (VS Code recommended)

### 🎯 Choose Your Setup Method

#### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
git clone <your-repo-url>
cd Meterify
./setup-dev.bat
```

**Linux/Mac:**
```bash
git clone <your-repo-url>
cd Meterify
chmod +x setup-dev.sh && ./setup-dev.sh
```

#### Option 2: Manual Setup

1. **Clone and Install**
```bash
git clone <your-repo-url>
cd Meterify
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your database configuration
```

3. **Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database
npm run db:seed
```

4. **Start Development Server**
```bash
npm run start:dev
```

## 🌐 API Documentation

Once running, visit:
- **API Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/api/v1/health
- **Detailed Health Check**: http://localhost:3000/api/v1/health/detailed

### Default Credentials

- **Admin Email**: `admin@meterify.com`
- **Admin Password**: `admin123`
- **Sample API Key**: `mk_demo_key_123456789`

## 📊 Core API Endpoints

### Authentication
- `POST /api/v1/auth/admin/login` - Admin login
- `POST /api/v1/auth/admin/register` - Register new admin
- `GET /api/v1/auth/admin/profile` - Get admin profile

### User Management (Admin)
- `POST /api/v1/admin/users` - Create user
- `GET /api/v1/admin/users` - List users with pagination
- `GET /api/v1/admin/users/:id` - Get user details
- `PATCH /api/v1/admin/users/:id` - Update user
- `POST /api/v1/admin/users/:id/regenerate-api-key` - Regenerate API key

### Usage Tracking
- `POST /api/v1/log/usage` - Log API usage (API key required)
- `GET /api/v1/usage/summary/:userId` - Get usage summary
- `GET /api/v1/usage/logs/:userId` - Get usage logs
- `GET /api/v1/usage/analytics/system` - System analytics

### Rate Limiting
- `GET /api/v1/rate-limit/check/:userId` - Check rate limit
- `POST /api/v1/rate-limit/increment/:userId` - Increment counter
- `PUT /api/v1/admin/rate-limit/user/:userId` - Update user rate limits

### Billing
- `POST /api/v1/billing/admin/generate-invoices` - Generate monthly invoices
- `GET /api/v1/billing/invoices/:userId` - Get user invoices
- `GET /api/v1/billing/invoice/:invoiceId` - Get invoice details
- `PATCH /api/v1/billing/admin/invoice/:invoiceId/mark-paid` - Mark as paid

### Payment Processing (Phase 2)
- `POST /api/v1/payments/order/create` - Create Razorpay order
- `POST /api/v1/payments/verify` - Verify payment signature
- `GET /api/v1/payments/payment/:paymentId` - Get payment details
- `POST /api/v1/payments/webhook` - Handle Razorpay webhooks
- `POST /api/v1/payments/capture/:paymentId` - Capture payment

### Notifications (Phase 2)
- `POST /api/v1/notifications/email/send` - Send email notification
- `POST /api/v1/notifications/pdf/generate` - Generate PDF document
- `POST /api/v1/notifications/pdf/save` - Save PDF to storage
- `GET /api/v1/notifications/email/verify` - Verify email configuration

### Admin Dashboard
- `GET /api/v1/admin/dashboard` - Dashboard overview
- `GET /api/v1/admin/metrics/user-growth` - User growth metrics
- `GET /api/v1/admin/metrics/revenue` - Revenue metrics
- `GET /api/v1/admin/system/health` - System health status
- `GET /api/v1/admin/system/health` - System health

## 💾 Database Schema

### Core Tables
- **users**: User accounts with API keys and settings
- **api_endpoints**: API endpoint definitions
- **api_usage_logs**: Detailed usage tracking
- **monthly_usage_summary**: Aggregated monthly usage
- **billing_invoices**: Generated invoices
- **pricing_tiers**: Configurable pricing plans
- **admin_users**: Admin user accounts
- **rate_limit_tracker**: Rate limiting counters

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"  # SQLite for development
# DATABASE_URL="postgresql://username:password@localhost:5432/meterify?schema=public"  # PostgreSQL for production

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# API
API_PREFIX="api/v1"
PORT=3000

# Rate Limiting
DEFAULT_RATE_LIMIT=1000
DEFAULT_RATE_WINDOW=3600

# SMTP Configuration (Phase 2)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM_NAME="Meterify"
SMTP_FROM_EMAIL="noreply@meterify.com"

# Razorpay Configuration (Phase 2)
RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_secret_key"

# Application
NODE_ENV="development"
LOG_LEVEL="info"

# Billing
DEFAULT_PRICE_PER_1000_CALLS=10
CURRENCY="INR"

# Environment
NODE_ENV="development"
LOG_LEVEL="debug"
```

### Pricing Tiers

Default pricing tiers (configurable via admin API):
- **FREE**: 1,000 calls/hour, ₹0 per 1K calls
- **BASIC**: 5,000 calls/hour, ₹10 per 1K calls
- **PRO**: 20,000 calls/hour, ₹25 per 1K calls
- **ENTERPRISE**: 100,000 calls/hour, ₹50 per 1K calls

## 🐳 Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

The Docker setup includes:
- **PostgreSQL**: Database server
- **Redis**: Caching and session storage
- **Meterify**: Main application
- **Nginx**: Reverse proxy with rate limiting

## 📈 Usage Example

### 1. Create a User (Admin)
```bash
curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "pricingTier": "BASIC"
  }'
```

### 2. Log API Usage
```bash
curl -X POST http://localhost:3000/api/v1/log/usage \
  -H "X-API-Key: USER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "endpoint": "/api/v1/data",
    "method": "GET",
    "statusCode": 200,
    "responseTime": 150
  }'
```

### 3. Check Rate Limit
```bash
curl -X GET http://localhost:3000/api/v1/rate-limit/check/USER_ID \
  -H "X-API-Key: USER_API_KEY"
```

### 4. Generate Monthly Invoices
```bash
curl -X POST http://localhost:3000/api/v1/billing/admin/generate-invoices \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
```

## 📊 Automated Tasks

Meterify includes automated background tasks:

- **Monthly Invoice Generation**: Runs on the 1st of each month
- **Overdue Invoice Marking**: Runs daily at midnight
- **Rate Limit Cleanup**: Periodic cleanup of old rate limit data

## 🧪 Testing

Meterify includes comprehensive test coverage with TDD approach:

### Run Tests
```bash
# Unit tests
npm run test:unit

# Integration tests (when available)
npm run test:e2e

# Test coverage
npm run test:cov
```

### Test Coverage
- **16 test suites** with **108 tests** - All Passing ✅
- **Phase 1**: Authentication, Users, Usage tracking, Billing, Rate limiting
- **Phase 2**: Payments (Razorpay), Email notifications, PDF generation, Health checks
- **Mocking**: Comprehensive mocking for third-party services (Razorpay, Nodemailer, Puppeteer)
- **TDD**: All new features developed with test-driven development
- **CI/CD Ready**: Tests run automatically on development server start

### Testing Third-Party Integrations
- **Razorpay payments** with comprehensive mock responses and error scenarios
- **Email service** with nodemailer mocks and SMTP simulation
- **PDF generation** with puppeteer mocks and file system operations
- **Database operations** with in-memory SQLite for isolated testing
- **Health monitoring** with real-time service status checks

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugging

# Production
npm run build              # Build for production
npm run start:prod         # Start production server

# Database
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open Prisma Studio
npm run db:seed           # Seed database

# Utilities
npm run lint              # Lint code
npm run format            # Format code
```

## 🚀 Deployment Options

### 1. Railway (Recommended for beginners)
- Connect your GitHub repo
- Set environment variables
- Deploy automatically

### 2. Render
- Connect GitHub repo
- Configure build and start commands
- Set environment variables

### 3. VPS/Cloud Server
- Use Docker Compose
- Set up reverse proxy
- Configure SSL certificates

### 4. Railway Template
```bash
# One-click deploy to Railway
railway template deploy --template https://github.com/your-username/meterify
```

## 💰 Cost Estimation

### Development/Testing
- **Local**: Free
- **Railway/Render**: $5-10/month

### Production (Small Scale)
- **Database**: $10-20/month
- **Server**: $10-25/month
- **Total**: ~$25-45/month

### Production (Scale)
- **Database**: $25-50/month
- **Server**: $25-100/month
- **CDN/Storage**: $5-20/month
- **Total**: ~$55-170/month

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 Documentation

- **[API Documentation](http://localhost:3000/docs)** - Interactive Swagger UI (when server is running)
- **[Development Summary](./DEVELOPMENT_SUMMARY.md)** - Complete development guide and project overview
- **[Project Status](./PROJECT_STATUS.md)** - Current status, progress, and next steps
- **[Changelog](./CHANGELOG.md)** - Detailed version history and feature additions
- **[Environment Setup](./.env.example)** - Configuration variables and setup guide

## 🆘 Support

- **Documentation**: Check `/docs` endpoint when server is running
- **Issues**: Create GitHub issues for bugs
- **Questions**: Use GitHub Discussions

## 🛣️ Roadmap

### ✅ Phase 1 (Completed - MVP)
- ✅ Core API usage tracking and logging
- ✅ User management with API keys
- ✅ Rate limiting implementation
- ✅ Billing system with invoice generation
- ✅ Admin dashboard and analytics
- ✅ Pricing tier management

### ✅ Phase 2 (Completed - Payment Integration)
- ✅ Razorpay payment gateway integration
- ✅ Email notification system with HTML templates
- ✅ PDF invoice generation
- ✅ Health monitoring for third-party services
- ✅ Comprehensive test coverage (TDD)

### 🚧 Phase 3 (In Planning - Advanced Features)
- 🔮 **Advanced Analytics**: Real-time dashboards and ML insights
- 🏢 **Enterprise Features**: Multi-tenant architecture
- 📱 **Mobile Integration**: React Native SDK
- 🤖 **AI Features**: Usage anomaly detection
- 🌐 **Frontend Dashboard**: React-based admin panel
- 🔒 **Advanced Security**: OAuth2, SAML integration
- 💳 **Multiple Payment Gateways**: Stripe, PayPal support
- 🌍 **Internationalization**: Multi-language support

### 🎯 Phase 4 (Future Vision)
- 🛍️ **API Marketplace**: Public API directory
- 🔗 **Webhook System**: Real-time event notifications
- 📊 **Advanced Reporting**: Custom report builder
- 🏗️ **Infrastructure**: Auto-scaling and global CDN
- 🤝 **Partnerships**: Integration with major platforms

## 📊 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client APIs   │───▶│   Meterify API   │───▶│  SQLite/PostgreSQL │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ├──────────────┐
                                ▼              ▼
                       ┌──────────────────┐ ┌─────────────────┐
                       │   Razorpay API   │ │  Email Service  │
                       └──────────────────┘ └─────────────────┘
                                ▼
                       ┌──────────────────┐
                       │   Admin Panel    │
                       │  (Swagger Docs)  │
                       └──────────────────┘
```

## 🏆 Current Status

**Version**: 2.0.0  
**Status**: ✅ Production Ready (Phase 1 & 2 Complete)  
**Test Coverage**: 16 test suites, 108 tests passing  
**API Endpoints**: 50+ documented endpoints  
**Third-party Integrations**: ✅ Razorpay, ✅ Email (SMTP), ✅ PDF Generation  
**Health Monitoring**: ✅ Real-time service status checks  
**Documentation**: ✅ Complete Swagger API docs  
**Date Updated**: July 2, 2025

---

**Built with ❤️ for the developer community**

**⭐ If this project helps you, please consider giving it a star!**