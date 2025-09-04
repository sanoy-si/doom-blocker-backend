#!/bin/bash

# Gemini Ping Monitor Script
# This script continuously pings the gemini_ping endpoint every second

# Configuration
ENDPOINT="http://localhost:8000/gemini_ping"
INTERVAL=1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log with timestamp
log_with_timestamp() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Function to ping the endpoint
ping_endpoint() {
    local response
    local http_code

    # Make the curl request and capture both response and HTTP status code
    response=$(curl -s -w "\n%{http_code}" --connect-timeout 5 --max-time 10 "$ENDPOINT" 2>/dev/null)

    if [ $? -eq 0 ]; then
        # Extract HTTP status code (last line)
        http_code=$(echo "$response" | tail -n1)
        # Extract response body (all but last line)
        body=$(echo "$response" | head -n -1)

        if [ "$http_code" -eq 200 ]; then
            echo -e "${GREEN}✅ SUCCESS${NC} - HTTP $http_code"
            echo "Response: $body"
        else
            echo -e "${YELLOW}⚠️  WARNING${NC} - HTTP $http_code"
            echo "Response: $body"
        fi
    else
        echo -e "${RED}❌ ERROR${NC} - Failed to connect to $ENDPOINT"
        echo "Possible reasons: Server down, network issue, or wrong URL"
    fi
}

# Main execution
echo "======================================"
echo "🚀 Gemini Ping Monitor Started"
echo "======================================"
echo "Endpoint: $ENDPOINT"
echo "Interval: ${INTERVAL}s"
echo "Press Ctrl+C to stop"
echo "======================================"

# Initialize counters
success_count=0
error_count=0
total_count=0

# Main loop
while true; do
    total_count=$((total_count + 1))

    log_with_timestamp "Ping #$total_count"

    # Ping the endpoint
    ping_result=$(ping_endpoint)
    echo "$ping_result"

    # Update counters
    if echo "$ping_result" | grep -q "SUCCESS"; then
        success_count=$((success_count + 1))
    else
        error_count=$((error_count + 1))
    fi

    # Show statistics every 10 pings
    if [ $((total_count % 10)) -eq 0 ]; then
        echo "📊 Stats: Total=$total_count, Success=$success_count, Errors=$error_count"
    fi

    echo "--------------------------------------"

    # Wait for the specified interval
    sleep $INTERVAL
done
