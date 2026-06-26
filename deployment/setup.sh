#!/bin/bash
# VPS Setup Script for SwiftSoftware
# Run as root on Hetzner VPS

set -e

echo "🚀 SWIFTSOFTWARE VPS SETUP"
echo "=========================="
echo "Date: $(date)"
echo "VPS IP: 178.156.221.18"
echo ""

# Update system
echo "📦 Updating system..."
apt-get update -qq
apt-get install -y -qq git curl wget ufw fail2ban

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose
echo "📝 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Setup directories
echo "📁 Creating directories..."
mkdir -p /opt/swift/{postgres-data,redis-data,ssl}
cd /opt/swift

# Clone repositories
echo "⬇️  Cloning repositories..."
# FunnelSwift
git clone https://github.com/SwiftSoftware204/FunnelSwift.git funnelswift-rust

# CoreSwift CRM
git clone https://github.com/SwiftSoftware204/CRMSwift.git crmswift-source

# Copy deployment files
echo "📋 Copying deployment files..."
cp funnelswift-rust/deployment/docker-compose.yml .
cp funnelswift-rust/deployment/nginx.conf .

# Create environment file
echo "🔐 Creating environment file..."
cat > .env << 'EOF'
# Database
POSTGRES_USER=swift
POSTGRES_PASSWORD=SwiftSecure2026!

# FunnelSwift
FUNNELSWIFT_SUPABASE_URL=https://emklnfkjfnzlfjtnxccy.supabase.co
FUNNELSWIFT_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
FUNNELSWIFT_PORT=8080

# CoreSwift CRM
CRM_PORT=8081
CRM_JWT_SECRET=CoreSwiftSecure2026!
EOF

# Setup firewall
echo "🔥 Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "✅ SETUP COMPLETE!"
echo "=================="
echo "Next steps:"
echo "1. Edit /opt/swift/.env with your real Supabase credentials"
echo "2. Run: cd /opt/swift && docker-compose up -d --build"
echo "3. Configure Cloudflare DNS to point to 178.156.221.18"
echo ""