#!/usr/bin/env node

/**
 * Pre-Deployment Checker
 * Validates that all required configurations are in place before deployment
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking Deployment Readiness...\n');

let errors = [];
let warnings = [];
let success = [];

// Check if .env files exist
function checkEnvFile(filePath, name) {
  if (fs.existsSync(filePath)) {
    success.push(`✅ ${name} exists`);
    
    // Check for placeholder values
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('your_mongodb_connection_string') || 
        content.includes('your_very_strong_jwt_secret') ||
        content.includes('yourdomain.com') ||
        content.includes('your_email@gmail.com')) {
      warnings.push(`⚠️  ${name} contains placeholder values - Update before deployment!`);
    }
  } else {
    errors.push(`❌ ${name} not found - Copy from .env.production.example`);
  }
}

// Check backend .env
checkEnvFile(
  path.join(__dirname, 'backend', '.env'),
  'Backend .env'
);

// Check form server .env
checkEnvFile(
  path.join(__dirname, 'backend', 'form', 'server', '.env'),
  'Form Server .env'
);

// Check frontend .env.production
checkEnvFile(
  path.join(__dirname, 'frontend', '.env.production'),
  'Frontend .env.production'
);

// Check for hardcoded credentials in code (basic check)
console.log('\n📝 Checking for hardcoded credentials...');

function checkFileForCredentials(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('mongodb+srv://gogtekulam:gogtekul')) {
      errors.push(`❌ Hardcoded MongoDB credentials found in ${filePath}`);
    } else {
      success.push(`✅ No hardcoded credentials in ${path.basename(filePath)}`);
    }
  }
}

checkFileForCredentials(path.join(__dirname, 'backend', 'server.js'));
checkFileForCredentials(path.join(__dirname, 'backend', 'form', 'server', 'server.js'));

// Check if node_modules exist
console.log('\n📦 Checking dependencies...');

['backend', 'frontend', 'backend/form/server'].forEach(dir => {
  const nodeModulesPath = path.join(__dirname, dir, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    success.push(`✅ ${dir} dependencies installed`);
  } else {
    warnings.push(`⚠️  ${dir} dependencies not installed - Run 'npm install' in ${dir}`);
  }
});

// Print results
console.log('\n═══════════════════════════════════════════════════════');
console.log('                    RESULTS                              ');
console.log('═══════════════════════════════════════════════════════\n');

if (success.length > 0) {
  console.log('✅ SUCCESS:\n');
  success.forEach(msg => console.log('  ' + msg));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  warnings.forEach(msg => console.log('  ' + msg));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ ERRORS:\n');
  errors.forEach(msg => console.log('  ' + msg));
  console.log('');
}

console.log('═══════════════════════════════════════════════════════\n');

// Print deployment status
if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 Your application is READY for deployment!\n');
  console.log('Next steps:');
  console.log('1. Review DEPLOYMENT_READY.md for critical pre-deployment actions');
  console.log('2. Follow DEPLOYMENT_GODADDY.md for deployment instructions\n');
  process.exit(0);
} else if (errors.length === 0) {
  console.log('⚠️  Your application has warnings but can proceed to deployment.');
  console.log('   Please address warnings before going to production.\n');
  console.log('Next steps:');
  console.log('1. Address the warnings above');
  console.log('2. Review DEPLOYMENT_READY.md');
  console.log('3. Follow DEPLOYMENT_GODADDY.md\n');
  process.exit(0);
} else {
  console.log('❌ Your application is NOT ready for deployment.');
  console.log('   Please fix the errors above before deploying.\n');
  process.exit(1);
}
