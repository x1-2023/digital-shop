#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Run this before deployment to check all required variables
 */

const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'SESSION_SECRET'
]

const optionalVars = [
  'RESEND_API_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_BUCKET',
  'BANK_ACCOUNT',
  'BANK_ACCOUNT_HOLDER',
  'LICENSE_JWT_SECRET'
]

const warnings = []
const errors = []

console.log('🔍 Checking environment variables...\n')

// Check required variables
requiredVars.forEach(varName => {
  const value = process.env[varName]

  if (!value) {
    errors.push(`❌ MISSING: ${varName}`)
  } else if (value.includes('your-') || value.includes('change-this')) {
    errors.push(`❌ PLACEHOLDER: ${varName} contains placeholder value`)
  } else if (varName.includes('SECRET') && value.length < 32) {
    errors.push(`❌ WEAK: ${varName} should be at least 32 characters`)
  } else {
    console.log(`✅ ${varName}`)
  }
})

console.log('\n📋 Optional variables:\n')

// Check optional variables
optionalVars.forEach(varName => {
  const value = process.env[varName]

  if (!value) {
    warnings.push(`⚠️  NOT SET: ${varName} (optional)`)
  } else if (value.includes('your-') || value.includes('change-this')) {
    warnings.push(`⚠️  PLACEHOLDER: ${varName}`)
  } else {
    console.log(`✅ ${varName}`)
  }
})

// Print summary
console.log('\n' + '='.repeat(60))

if (errors.length > 0) {
  console.log('\n❌ ERRORS FOUND:\n')
  errors.forEach(err => console.log(err))
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:\n')
  warnings.forEach(warn => console.log(warn))
}

console.log('\n' + '='.repeat(60))

if (errors.length > 0) {
  console.log('\n🚫 Environment validation FAILED')
  console.log('Please fix the errors above before deploying.\n')
  process.exit(1)
} else if (warnings.length > 0) {
  console.log('\n⚠️  Environment validation PASSED with warnings')
  console.log('Some optional features may not work.\n')
  process.exit(0)
} else {
  console.log('\n✅ Environment validation PASSED')
  console.log('All required variables are set correctly.\n')
  process.exit(0)
}
