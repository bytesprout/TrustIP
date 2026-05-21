import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  const defaultPlans = [
    {
      name: 'Free',
      slug: 'free',
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'USD',
      requestLimitMonthly: 10000,
      requestsPerMinute: 60,
      analyticsRetentionDays: 30,
      features: { basic_lookup: true, intelligence_lookup: false, trust_lookup: false },
    },
    {
      name: 'Starter',
      slug: 'starter',
      monthlyPrice: 29.99,
      annualPrice: 299.99,
      currency: 'USD',
      requestLimitMonthly: 100000,
      requestsPerMinute: 200,
      analyticsRetentionDays: 60,
      features: { basic_lookup: true, intelligence_lookup: true, trust_lookup: true },
    },
    {
      name: 'Business',
      slug: 'business',
      monthlyPrice: 149.99,
      annualPrice: 1499.99,
      currency: 'USD',
      requestLimitMonthly: 1000000,
      requestsPerMinute: 1000,
      analyticsRetentionDays: 90,
      features: { basic_lookup: true, intelligence_lookup: true, trust_lookup: true, admin_lookup: true },
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'USD',
      requestLimitMonthly: null,
      requestsPerMinute: 5000,
      analyticsRetentionDays: null,
      features: { basic_lookup: true, intelligence_lookup: true, trust_lookup: true, admin_lookup: true, enterprise: true },
    },
  ];

  for (const plan of defaultPlans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: {
        name: plan.name,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        currency: plan.currency,
        requestLimitMonthly: plan.requestLimitMonthly,
        requestsPerMinute: plan.requestsPerMinute,
        analyticsRetentionDays: plan.analyticsRetentionDays,
        features: plan.features,
        status: 'ACTIVE',
      },
      create: {
        name: plan.name,
        slug: plan.slug,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        currency: plan.currency,
        requestLimitMonthly: plan.requestLimitMonthly,
        requestsPerMinute: plan.requestsPerMinute,
        analyticsRetentionDays: plan.analyticsRetentionDays,
        features: plan.features,
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Plan: ${plan.slug}`);
  }

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'trustip-platform' },
    update: {},
    create: {
      name: 'TrustIP Platform',
      slug: 'trustip-platform',
      mode: 'saas',
      isActive: true,
    },
  });

  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // Create SUPER_ADMIN user
  const adminPassword = process.env['SEED_ADMIN_PASSWORD'] ?? 'TrustIP_Admin_2024!';
  const passwordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@trustip.io' },
    update: {},
    create: {
      email: 'admin@trustip.io',
      passwordHash,
      role: 'SUPER_ADMIN',
      tenantId: null,
      isActive: true,
    },
  });

  console.log(`✅ SUPER_ADMIN: ${admin.email} (${admin.id})`);

  // Seed default feature flags (global, tenantId = null)
  const defaultFlags = [
    { key: 'trustEngine', value: true },
    { key: 'billing', value: false },
    { key: 'geoAnomaly', value: true },
    { key: 'analytics', value: true },
    { key: 'vpnDetection', value: true },
  ];

  for (const flag of defaultFlags) {
    const existing = await prisma.featureFlag.findFirst({
      where: { key: flag.key, tenantId: null },
    });
    if (existing) {
      await prisma.featureFlag.update({
        where: { id: existing.id },
        data: { value: flag.value },
      });
    } else {
      await prisma.featureFlag.create({
        data: { key: flag.key, value: flag.value, tenantId: null },
      });
    }
    console.log(`✅ Feature flag: ${flag.key} = ${String(flag.value)}`);
  }

  // Seed default system config
  const configs = [
    { key: 'maintenance_mode', value: false },
    { key: 'max_api_keys_per_tenant', value: 10 },
    { key: 'default_rate_limit_per_minute', value: 100 },
    { key: 'billing_mode', value: 'MANUAL' },
    { key: 'billing_trial_days', value: 7 },
    { key: 'billing_grace_days', value: 7 },
  ];

  for (const config of configs) {
    const result = await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: { key: config.key, value: config.value },
    });
    console.log(`✅ System config: ${result.key}`);
  }

  // Create a sample API key for the default tenant
  const rawApiKey = `tk_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');
  const keyPrefix = rawApiKey.substring(0, 12);

  await prisma.apiKey.upsert({
    where: { keyHash },
    update: {},
    create: {
      keyHash,
      keyPrefix,
      tenantId: tenant.id,
      scopes: ['basic_lookup'],
      isActive: true,
    },
  });

  console.log(`✅ Sample API key prefix: ${keyPrefix}...`);

  const starterPlan = await prisma.plan.findUnique({ where: { slug: 'starter' } });
  if (starterPlan) {
    await prisma.subscription.upsert({
      where: { id: `seed-sub-${tenant.id}` },
      update: {},
      create: {
        id: `seed-sub-${tenant.id}`,
        tenantId: tenant.id,
        planId: starterPlan.id,
        status: 'ACTIVE',
        billingCycle: 'MANUAL',
        startsAt: new Date(),
        expiresAt: null,
        manualOverride: true,
        autoRenew: false,
      },
    });

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        subscriptionPlanId: starterPlan.id,
        monthlyRequestLimit: starterPlan.requestLimitMonthly,
        rateLimitPerMinute: starterPlan.requestsPerMinute,
        analyticsRetentionDays: starterPlan.analyticsRetentionDays,
      },
    });

    console.log('✅ Seeded default manual subscription');
  }

  console.log('\n📋 Seed Summary:');
  console.log(`   Admin email: admin@trustip.io`);
  console.log(`   Admin password: ${adminPassword}`);
  console.log('\n⚠️  Change the admin password in production!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect().catch(console.error);
  });
