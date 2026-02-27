#!/bin/bash
# Script tự động deploy Cloudflare Worker

set -e

echo "🚀 Deploying Cloudflare Worker..."

# Kiểm tra wrangler
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler..."
    npm install -g wrangler
fi

# Login nếu chưa login
echo "🔑 Checking Cloudflare login..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  Please login to Cloudflare first..."
    wrangler login
fi

# Set API Key
echo "🔐 Setting GEMINI_API_KEY..."
read -p "Enter your Gemini API Key (AIza...): " API_KEY
wrangler secret put GEMINI_API_KEY --name gemini-proxy-duky <<< "$API_KEY"

# Deploy
echo "🚀 Deploying..."
wrangler deploy

echo "✅ Deploy completed!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the URL above (https://gemini-proxy-duky.XXX.workers.dev)"
echo "2. Add to your VPS .env.local:"
echo "   GEMINI_PROXY_URL=https://gemini-proxy-duky.XXX.workers.dev"
echo "3. Restart your VPS service"
