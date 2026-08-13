#!/bin/bash
# deploy-railway.sh — Deploy all 3 KrishiMitra services to Railway
# Run this ONCE after: railway login && railway link
#
# Set your env vars in Railway Dashboard or via:
#   railway variables set KEY=VALUE --service <name>
#
# Required env vars — set these in Railway Dashboard (not here):
#   krishi-ai:     DEEPSEEK_API_KEY, SERVICE_KEY
#   krishi-server: MONGO_URI, JWT_SECRET, SERVICE_KEY, TAVILY_API_KEY,
#                  PORT=5000, PYTHON_SERVICE_URL, CLIENT_URL
#   krishi-client: VITE_API_URL
#
# See DEPLOY.md for full variable values.

set -e
RAILWAY="PATH=/opt/homebrew/bin:$PATH railway"

echo "🚂 KrishiMitra Railway Deployment"
echo "=================================="

$RAILWAY whoami || { echo "❌ Not logged in. Run: PATH=/opt/homebrew/bin:$PATH railway login"; exit 1; }

echo ""
echo "Deploying krishi-ai (FastAPI + ML)..."
$RAILWAY up --service krishi-ai
echo "✅ krishi-ai deployed"

echo ""
echo "Deploying krishi-server (Node.js)..."
$RAILWAY up --service krishi-server
echo "✅ krishi-server deployed"

echo ""
echo "⚠️  Before deploying client:"
echo "   1. Get krishi-server Railway domain from dashboard"
echo "   2. Set VITE_API_URL=https://<server-domain>/api in krishi-client"
echo "   3. Then run: \$RAILWAY up --service krishi-client"
echo ""
echo "🎉 Backend deployment complete!"
