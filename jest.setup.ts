// jest.setup.ts
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tugasku_test';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret-key-1234567890';
process.env.MASTER_API_KEY = process.env.MASTER_API_KEY || 'tk_master_margaasih_2026';

jest.setTimeout(30000);