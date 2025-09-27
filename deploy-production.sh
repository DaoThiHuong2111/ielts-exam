#!/bin/bash

# ===========================================
# PRODUCTION DEPLOYMENT SCRIPT
# ===========================================
# Usage: ./deploy-production.sh

set -e

echo "🚀 Starting production deployment for hihihehehaha.live"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root"
   exit 1
fi

# Domain configuration
DOMAIN="hihihehehaha.live"
EMAIL="admin@hihihehehaha.live"  # Change this to your email

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p /var/www/certbot
mkdir -p ./ssl

# Install dependencies (excluding Docker since it's already installed)
echo "📦 Installing dependencies..."
apt update
apt install -y curl wget git nginx certbot python3-certbot-nginx

# Stop nginx system service to avoid port conflict with docker nginx
echo "🛑 Stopping system nginx service..."
systemctl stop nginx
systemctl disable nginx

# Create Docker network if not exists
echo "🔗 Creating Docker network..."
docker network create ielts-network-prod 2>/dev/null || true

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.production.yml --env-file .env.production down --remove-orphans 2>/dev/null || true

# Request SSL certificate
echo "🔒 Requesting SSL certificate..."
certbot certonly --nginx --non-interactive --agree-tos --email $EMAIL -d $DOMAIN || {
    echo "⚠️  SSL certificate request failed, using self-signed for initial setup"
    mkdir -p ./ssl/hihihehehaha.live
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ./ssl/hihihehehaha.live/privkey.pem \
        -out ./ssl/hihihehehaha.live/fullchain.pem \
        -subj "/C=VN/ST=Ho Chi Minh/L=Ho Chi Minh/O=IELTS Exams/CN=$DOMAIN"
}

# Copy certificates if they exist
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "📋 Copying Let's Encrypt certificates..."
    mkdir -p ./ssl/$DOMAIN
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ./ssl/$DOMAIN/
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ./ssl/$DOMAIN/
    chown -R $USER:$USER ./ssl
fi

# Build and start services
echo "🏗️  Building and starting services..."
docker compose -f docker-compose.production.yml --env-file .env.production build --no-cache
docker compose -f docker-compose.production.yml --env-file .env.production up -d --scale frontend=3 --scale backend=1

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Setup auto-renewal for SSL
echo "🔄 Setting up SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --nginx") | crontab -

# Check service status
echo "✅ Checking service status..."
docker-compose -f docker-compose.production.yml --env-file .env.production ps

# Test HTTPS connection
echo "🌐 Testing HTTPS connection..."
sleep 5
if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200\|301\|302"; then
    echo "✅ HTTPS is working correctly!"
else
    echo "⚠️  HTTPS test failed, please check nginx logs"
fi

echo "🎉 Deployment completed successfully!"
echo "📍 Your application is available at: https://$DOMAIN"
echo "📊 Check logs with: docker-compose -f docker-compose.production.yml logs -f"
echo "🔄 Update SSL with: certbot renew --nginx"