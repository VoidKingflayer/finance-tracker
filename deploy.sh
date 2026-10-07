#!/usr/bin/env bash
set -e

SERVER="root@72.56.65.153"
APP_DIR="/var/www/finance"

echo "=========================================================="
echo "  🚀 Обновление ФинТрекера на боевом сервере ($SERVER)"
echo "=========================================================="

ssh "$SERVER" "cd $APP_DIR && git pull origin main && chown -R www-data:www-data $APP_DIR && systemctl reload nginx"

echo ""
echo "✅ Успешно обновлено!"
echo "👉 Ссылка: https://tochkabatumi.ge/finance/"
