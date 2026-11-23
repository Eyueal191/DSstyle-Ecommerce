#!/bin/bash
set -e

echo "================================================="
echo "  DS Style All-in-One Container (MongoDB + Node) "
echo "================================================="

# Create directories if missing
mkdir -p /data/db /app/uploads/products /app/uploads/userProfiles

# 1. Start MongoDB in background
echo "📦 Starting MongoDB service..."
mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db --bind_ip_all

# Wait for MongoDB to become ready
echo "⏳ Waiting for MongoDB to respond to ping..."
until mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
  sleep 1
done
echo "✅ MongoDB is connected and ready!"

# 2. No automatic seeding. To load sample products into an empty DB:
#      docker compose exec backend node scripts/seed.js   (add --force to replace all products)

# 3. Start Node.js Express server
echo "🚀 Starting DS Style Backend Server on port ${PORT:-3040}..."
exec node index.js
