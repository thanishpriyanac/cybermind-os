/**
 * Idempotent Admin User Seeder for Identity Service
 * Usage: node seed-admin.js
 */
const { Client } = require('pg');
const crypto = require('crypto');

const connectionString = process.env.DATABASE_URL || 'postgresql://cybermind:cybermind_secret@localhost:5432/cybermind_identity';
const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@cybermind.local';
const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'ChangeMe123!';
const tenantId = process.env.INITIAL_TENANT_ID || 'cybermind-master-tenant';

// Same hashing algorithm as the identity service (assuming bcrypt/scrypt or crypto)
// For simplicity in a raw script without dependencies, assuming standard crypto pbkdf2 or similar.
// If Identity Service uses bcrypt, we would require('bcrypt'). We'll assume the script runs in the identity container where bcrypt is available.
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  console.warn("bcrypt not found. Please run this script where the 'bcrypt' module is installed (e.g. inside the identity container) or install it via npm install bcrypt.");
  process.exit(1);
}

async function seed() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log(`Connected to database at ${connectionString.split('@')[1]}`);

    // Check if tenant exists
    const tenantRes = await client.query('SELECT id FROM tenants WHERE id = $1', [tenantId]);
    if (tenantRes.rowCount === 0) {
      console.log(`Creating tenant: ${tenantId}...`);
      await client.query('INSERT INTO tenants (id, name, created_at) VALUES ($1, $2, NOW())', [tenantId, 'Master Tenant']);
    } else {
      console.log(`Tenant ${tenantId} already exists. Skipping.`);
    }

    // Check if admin user exists
    const userRes = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (userRes.rowCount === 0) {
      console.log(`Creating admin user: ${adminEmail}...`);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      await client.query(
        'INSERT INTO users (id, email, password_hash, tenant_id, role, created_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())',
        [adminEmail, hashedPassword, tenantId, 'admin']
      );
      console.log('Admin user created successfully.');
    } else {
      console.log(`User ${adminEmail} already exists. Skipping.`);
    }

  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await client.end();
  }
}

seed();
