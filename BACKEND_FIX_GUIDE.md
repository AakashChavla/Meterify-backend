# 🚨 Backend Issues Fix Guide

## Current Issues Identified:

1. ❌ **Database Error**: `admin_users` table doesn't exist
2. ❌ **API Routes 404**: Routes not properly configured
3. ⚠️  **Razorpay Warning**: Configuration issue (non-critical)

## 🔧 Quick Fix Solution:

### Step 1: Stop Current Backend Server
- Press `Ctrl+C` in the terminal where backend is running

### Step 2: Run Database Fix
```bash
cd "d:\aakash\gitHub\Meterify-1\Meterify-backend"
fix-database.bat
```

### Step 3: Restart Backend Server
```bash
npm run start:dev
```

## 🎯 What the Fix Does:

### Database Setup:
- ✅ Creates missing `admin_users` table
- ✅ Creates default admin user (admin@meterify.com / admin123)
- ✅ Sets up pricing tiers (FREE, BASIC, PRO, ENTERPRISE)
- ✅ Ensures all tables are properly configured

### Configuration:
- ✅ Fixes Razorpay configuration warnings
- ✅ Ensures API routes are properly mapped

## 🎉 After the Fix:

### Backend URLs Should Work:
- **API Base**: http://localhost:3000/api/v1
- **Health Check**: http://localhost:3000/api/v1/health
- **Admin Login**: POST http://localhost:3000/api/v1/auth/admin/login
- **User Login**: POST http://localhost:3000/api/v1/auth/user/login
- **API Docs**: http://localhost:3000/docs

### Test Admin Login:
```json
{
  "email": "admin@meterify.com",
  "password": "admin123"
}
```

## 🔍 Verification Steps:

1. **Check server logs** - Should see no database errors
2. **Test health endpoint** - Should return 200 OK
3. **Try admin login** - Should work with credentials above
4. **Check API docs** - Should be accessible at /docs

## 🚀 Next Steps:

Once backend is fixed:
1. Start frontend: `npm run dev` in Meterify-frontend
2. Test full integration
3. Verify user and admin dashboards work

---

**If issues persist, check the console logs and contact support.**
