#!/bin/bash

# Simple auto-topup cron script for system crontab
# This script calls the Next.js API endpoint

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
API_URL="http://localhost:3000/api/cron/auto-topup"
LOG_DIR="/root/digital-shop/logs"
LOG_FILE="$LOG_DIR/auto-topup.log"

# Create log directory if not exists
mkdir -p "$LOG_DIR"

echo "[$TIMESTAMP] Running auto-topup..." >> "$LOG_FILE"

# Call API with curl
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" -H "Content-Type: application/json" --max-time 30 2>&1)

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

# Extract response body (all lines except last)
BODY=$(echo "$RESPONSE" | head -n-1)

# Log the result
if [ "$HTTP_CODE" = "200" ]; then
    echo "[$TIMESTAMP] SUCCESS (HTTP $HTTP_CODE)" >> "$LOG_FILE"
    echo "[$TIMESTAMP] Response: $BODY" >> "$LOG_FILE"
else
    echo "[$TIMESTAMP] ERROR (HTTP $HTTP_CODE)" >> "$LOG_FILE"
    echo "[$TIMESTAMP] Response: $BODY" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"

# Keep log file size manageable (keep last 5000 lines)
tail -n 5000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
