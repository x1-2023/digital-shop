#!/bin/bash
# ==============================================================================
# Auto-Topup Cron Setup Script
# ==============================================================================
# This script automatically sets up crontab for auto-topup
# ==============================================================================

echo "🚀 Setting up Auto-Topup Cron Job"
echo "=================================="

# Get project root directory
PROJECT_ROOT=$(pwd)
SCRIPT_PATH="$PROJECT_ROOT/scripts/auto-topup-simple.sh"

# Check if script exists
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "❌ Error: auto-topup-simple.sh not found at $SCRIPT_PATH"
    exit 1
fi

# Make script executable
chmod +x "$SCRIPT_PATH"
echo "✅ Made script executable"

# Check if cron entry already exists
if crontab -l 2>/dev/null | grep -q "auto-topup-simple.sh"; then
    echo "⚠️  Cron job already exists!"
    echo ""
    echo "Current crontab:"
    crontab -l | grep "auto-topup-simple.sh"
    echo ""
    read -p "Do you want to replace it? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled"
        exit 0
    fi
    # Remove existing entry
    crontab -l | grep -v "auto-topup-simple.sh" | crontab -
    echo "✅ Removed old cron job"
fi

# Add new cron entry (every 2 minutes)
(crontab -l 2>/dev/null; echo "*/2 * * * * $SCRIPT_PATH") | crontab -
echo "✅ Added cron job: */2 * * * * $SCRIPT_PATH"

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"
echo "✅ Created logs directory"

echo ""
echo "=================================="
echo "✅ Auto-Topup Cron Job Setup Complete!"
echo "=================================="
echo ""
echo "Cron schedule: Every 2 minutes"
echo "Script location: $SCRIPT_PATH"
echo "Logs location: $PROJECT_ROOT/logs/auto-topup.log"
echo ""
echo "To view logs:"
echo "  tail -f $PROJECT_ROOT/logs/auto-topup.log"
echo ""
echo "To check crontab:"
echo "  crontab -l"
echo ""
echo "To remove cron job:"
echo "  crontab -l | grep -v 'auto-topup-simple.sh' | crontab -"
echo ""
