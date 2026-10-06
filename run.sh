#!/usr/bin/env bash
PORT=${1:-8080}
IP=$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' || hostname -I | awk '{print $1}')

echo "=========================================================="
echo "  🚀 ФинТрекер (Finance Tracker) запущен!"
echo "=========================================================="
echo "  💻 На этом компьютере:  http://localhost:${PORT}"
if [ -n "$IP" ]; then
  echo "  📱 На телефоне (в сети Wi-Fi): http://${IP}:${PORT}"
fi
echo "=========================================================="
echo "  Нажмите Ctrl+C для остановки"
echo ""

python3 -m http.server "$PORT" --bind 0.0.0.0
