#!/bin/sh
set -e

echo "[init] Iniciando Redis server interno en 127.0.0.1:6379..."
redis-server --daemonize yes --protected-mode no --bind 127.0.0.1 --port 6379 --dir /tmp --pidfile /tmp/redis.pid --logfile /tmp/redis.log --save "" --appendonly no

# Breve espera para asegurar que Redis esté listo antes de que conecte el backend
sleep 1

echo "[init] Iniciando aplicaciones con PM2 (Backend + Worker)..."
exec pm2-runtime start ecosystem.config.cjs
