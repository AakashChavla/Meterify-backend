import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.adminUser.upsert({
    where: { email: 'admin@meterify.com' },
    update: {},
    create: {
      email: 'admin@meterify.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create pricing tiers
  const pricingTiers = [
    {
      name: 'FREE',
      description: 'Perfect for getting started',
      rateLimit: 1000,
      rateLimitWindow: 3600,
      pricePer1000Calls: 0,
    },
    {
      name: 'BASIC',
      description: 'Great for small projects',
      rateLimit: 5000,
      rateLimitWindow: 3600,
      pricePer1000Calls: 10,
    },
    {
      name: 'PRO',
      description: 'Perfect for growing businesses',
      rateLimit: 20000,
      rateLimitWindow: 3600,
      pricePer1000Calls: 25,
    },
    {
      name: 'ENTERPRISE',
      description: 'For high-volume applications',
      rateLimit: 100000,
      rateLimitWindow: 3600,
      pricePer1000Calls: 50,
    },
  ];

  for (const tier of pricingTiers) {
    const pricingTier = await prisma.pricingTier.upsert({
      where: { name: tier.name },
      update: {},
      create: tier,
    });
    console.log(`✅ Created pricing tier: ${pricingTier.name}`);
  }

  // Create sample API endpoints
  const endpoints = [
    {
      name: 'List Users',
      path: '/api/v1/users',
      method: 'GET',
      description: 'Get list of users',
    },
    {
      name: 'Create User',
      path: '/api/v1/users',
      method: 'POST',
      description: 'Create a new user',
    },
    {
      name: 'Get User',
      path: '/api/v1/users/:id',
      method: 'GET',
      description: 'Get user by ID',
    },
    {
      name: 'Update User',
      path: '/api/v1/users/:id',
      method: 'PUT',
      description: 'Update user by ID',
    },
    {
      name: 'Delete User',
      path: '/api/v1/users/:id',
      method: 'DELETE',
      description: 'Delete user by ID',
    },
  ];

  for (const endpoint of endpoints) {
    const apiEndpoint = await prisma.apiEndpoint.upsert({
      where: {
        path_method: {
          path: endpoint.path,
          method: endpoint.method as any,
        },
      },
      update: {},
      create: endpoint as any,
    });
    console.log(`✅ Created API endpoint: ${apiEndpoint.method} ${apiEndpoint.path}`);
  }

  // Create a sample user
  const sampleUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@example.com',
      apiKey: 'mk_demo_key_123456789',
      pricingTier: 'FREE',
      rateLimit: 1000,
      rateLimitWindow: 3600,
    },
  });

  console.log('✅ Created sample user:', sampleUser.email);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   - Admin User: ${adminUser.email} (password: admin123)`);
  console.log(`   - Sample User: ${sampleUser.email} (API Key: ${sampleUser.apiKey})`);
  console.log(`   - Pricing Tiers: ${pricingTiers.length} created`);
  console.log(`   - API Endpoints: ${endpoints.length} created`);
  console.log('\n🚀 You can now start the application!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
