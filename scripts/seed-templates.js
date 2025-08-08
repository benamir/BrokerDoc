// Simple Node.js script to seed templates
const { runSeed } = require('../lib/seed-templates.ts');

console.log('🌱 Starting template seeding...');

runSeed()
  .then(() => {
    console.log('✅ Template seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Template seeding failed:', error);
    process.exit(1);
  });