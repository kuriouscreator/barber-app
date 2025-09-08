#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function checkSecurity() {
  console.log('🔍 Security Check for BarberCuts App\n');

  const issues = [];
  const warnings = [];

  // Check for .env files
  const envFiles = [
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    '.env.test'
  ];

  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      issues.push(`❌ ${file} exists and should not be committed to git`);
    } else {
      console.log(`✅ ${file} not found (good)`);
    }
  });

  // Check for sensitive file extensions
  const sensitiveExtensions = ['.key', '.pem', '.p12', '.mobileprovision', '.keystore', '.jks'];
  const allFiles = getAllFiles('.');
  
  sensitiveExtensions.forEach(ext => {
    const found = allFiles.filter(file => file.endsWith(ext));
    if (found.length > 0) {
      issues.push(`❌ Found sensitive files: ${found.join(', ')}`);
    }
  });

  // Check if .env is in gitignore
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  if (!gitignoreContent.includes('.env')) {
    issues.push('❌ .env is not in .gitignore');
  } else {
    console.log('✅ .env is properly ignored in .gitignore');
  }

  // Check for hardcoded secrets in source files
  const sourceFiles = getAllFiles('src').filter(file => 
    file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')
  );

  const secretPatterns = [
    /sk-[a-zA-Z0-9]{20,}/, // OpenAI keys
    /AIza[0-9A-Za-z\\-_]{35}/, // Google API keys
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/, // UUIDs that might be keys
    /eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/, // JWT tokens
  ];

  sourceFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      secretPatterns.forEach(pattern => {
        if (pattern.test(content)) {
          warnings.push(`⚠️  Potential secret found in ${file}`);
        }
      });
    } catch (error) {
      // File might be binary or unreadable
    }
  });

  // Check for environment variable usage
  const envUsage = sourceFiles.filter(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes('process.env.') && !content.includes('EXPO_PUBLIC_');
    } catch (error) {
      return false;
    }
  });

  if (envUsage.length > 0) {
    warnings.push(`⚠️  Found non-EXPO_PUBLIC_ environment variables in: ${envUsage.join(', ')}`);
  }

  // Results
  console.log('\n📊 Security Check Results:');
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('🎉 All security checks passed!');
  } else {
    if (issues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      issues.forEach(issue => console.log(issue));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      warnings.forEach(warning => console.log(warning));
    }
  }

  console.log('\n💡 Tips:');
  console.log('- Use EXPO_PUBLIC_ prefix for client-side environment variables');
  console.log('- Never commit .env files to git');
  console.log('- Use Supabase anon keys (they\'re safe for client-side use)');
  console.log('- Keep service role keys server-side only');
}

function getAllFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        getAllFiles(filePath, fileList);
      } else if (stat.isFile()) {
        fileList.push(filePath);
      }
    });
  } catch (error) {
    // Directory might not exist or be accessible
  }
  return fileList;
}

checkSecurity();
