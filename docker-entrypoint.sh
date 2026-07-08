#!/bin/sh
set -e

echo "Menunggu MySQL siap..."

for i in $(seq 1 30); do
  if node -e "
    const mysql = require('mysql2/promise');
    mysql.createConnection({
      host: '${DATABASE_HOST:-localhost}',
      port: 3306,
      user: '${DATABASE_USER:-root}',
      password: '${DATABASE_PASSWORD:-}',
    }).then(c => { c.end(); process.exit(0); }).catch(() => process.exit(1));
  " 2>/dev/null; then
    echo "MySQL siap!"
    break
  fi
  echo "Menunggu database... ($i/30)"
  sleep 2
done

echo "Menjalankan migrasi Prisma..."
npx prisma migrate deploy

echo "Memulai Next.js server..."
exec node server.js
