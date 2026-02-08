#!/bin/bash

# Rewards System Setup Script
# This script applies the rewards migration using Supabase CLI

echo "🚀 Setting up rewards system..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    echo ""
    echo "Please run one of the following:"
    echo "  npm install -g supabase"
    echo "  or"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "⚠️  No supabase/config.toml found. Initializing..."
    supabase init
fi

echo "📋 Applying rewards migration..."
echo ""

# Apply the migration using Supabase CLI
supabase db push --include-all

echo ""
echo "✅ Migration completed!"
echo ""
echo "Next steps:"
echo "1. Check your Supabase dashboard to verify tables were created"
echo "2. Test the rewards functionality in your app"
echo ""
