#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function fixDatabase() {
  console.log('🔧 Fixing Meterify Backend Database...');
  
  const prisma = new PrismaClient();

  try {
    // Step 1: Check if admin_users table exists
    console.log('📊 Checking database tables...');
    
    try {
      await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='admin_users';`;
      console.log('✅ admin_users table exists');
    } catch (error) {
      console.log('❌ admin_users table missing, creating...');
      
      // Create admin_users table manually
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "admin_users" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "email" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "role" TEXT NOT NULL DEFAULT 'ADMIN',
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" DATETIME NOT NULL
        );
      `;
      
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_email_key" ON "admin_users"("email");
      `;
      
      console.log('✅ admin_users table created');
    }

    // Step 2: Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await prisma.$executeRaw`
      INSERT OR REPLACE INTO "admin_users" (id, email, password, name, role, is_active, created_at, updated_at)
      VALUES (
        'admin-' || hex(randomblob(16)),
        'admin@meterify.com',
        ${hashedPassword},
        'Admin User',
        'SUPER_ADMIN',
        true,
        datetime('now'),
        datetime('now')
      );
    `;
    
    console.log('✅ Admin user created: admin@meterify.com / admin123');

    // Step 3: Create default pricing tiers
    console.log('💰 Creating pricing tiers...');
    
    const pricingTiers = [
      { name: 'FREE', description: 'Perfect for getting started', rateLimit: 1000, rateLimitWindow: 3600, pricePer1000Calls: 0 },
      { name: 'BASIC', description: 'Great for small projects', rateLimit: 5000, rateLimitWindow: 3600, pricePer1000Calls: 10 },
      { name: 'PRO', description: 'Perfect for growing businesses', rateLimit: 20000, rateLimitWindow: 3600, pricePer1000Calls: 25 },
      { name: 'ENTERPRISE', description: 'For high-volume applications', rateLimit: 100000, rateLimitWindow: 3600, pricePer1000Calls: 50 }
    ];

    for (const tier of pricingTiers) {
      await prisma.$executeRaw`
        INSERT OR REPLACE INTO "pricing_tiers" (id, name, description, rate_limit, rate_limit_window, price_per_1000_calls, is_active, created_at, updated_at)
        VALUES (
          'tier-' || hex(randomblob(16)),
          ${tier.name},
          ${tier.description},
          ${tier.rateLimit},
          ${tier.rateLimitWindow},
          ${tier.pricePer1000Calls},
          true,
          datetime('now'),
          datetime('now')
        );
      `;
    }
    
    console.log('✅ Pricing tiers created');

    console.log('\n🎉 Database setup complete!');
    console.log('\n📱 Admin Login Credentials:');
    console.log('   Email: admin@meterify.com');
    console.log('   Password: admin123');
    console.log('\n🔄 Please restart your backend server now.');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabase().catch(console.error);
