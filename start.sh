#!/bin/bash
# Kill existing process
kill $(ps aux | grep funnelswift | grep -v grep | awk '{print $2}') 2>/dev/null

# Set env vars
export DATABASE_URL='postgres://swift:SwiftSecure2026!@127.0.0.1:5432/funnelswift'
export JWT_SECRET='funnelswift-jwt-secret-change-in-production-2026'

# Start
cd /opt/swift/funnelswift
nohup /opt/swift/funnelswift/target/release/funnelswift > /var/log/funnelswift.log 2>&1 &
echo "PID: $!"
sleep 2
cat /var/log/funnelswift.log
