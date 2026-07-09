#!/bin/sh
set -e

echo "Menunggu MySQL siap..."

for i in $(seq 1 30); do
  if node -e "
    require('net').createConnection({host:'${DATABASE_HOST:-localhost}',port:3306})
      .on('connect',function(){process.exit(0)})
      .on('error',function(){process.exit(1)});
  " 2>/dev/null; then
    echo "MySQL siap!"
    sleep 2
    break
  fi
  echo "Menunggu database... ($i/30)"
  sleep 2
done

echo "Menjalankan sinkronisasi database..."
node node_modules/prisma/build/index.js db push --accept-data-loss

echo "Menjalankan seed data..."
node prisma/seed.js

echo "Memulai Next.js server..."
exec node server.js
