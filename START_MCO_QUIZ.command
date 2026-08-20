#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "⚡ NCR Solutions — MCO Quiz Arena V4"
echo "Le serveur va démarrer. Garde cette fenêtre ouverte pendant le quiz."
echo ""
node server.js &
PID=$!
sleep 1
open "http://localhost:4173" 2>/dev/null || true
wait $PID
