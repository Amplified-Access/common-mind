#!/bin/sh
# Keeps emulator users across restarts: import the last export if one exists,
# and export again on shutdown.
set -e
PROJECT="${FIREBASE_PROJECT_ID:-demo-commonmind}"
DATA=/firebase/data

if [ -f "$DATA/firebase-export-metadata.json" ]; then
  exec firebase emulators:start --only auth --project "$PROJECT" --import "$DATA" --export-on-exit "$DATA"
fi
exec firebase emulators:start --only auth --project "$PROJECT" --export-on-exit "$DATA"
