#!/usr/bin/env bash
set -euo pipefail

services=(
  backend/api-gateway
  backend/profile-service
  backend/booking-service
  backend/submission-service
  backend/messaging-service
  backend/evaluation-service
  backend/live-session-service
  frontend
)

for service in "${services[@]}"; do
  name="$(basename "$service")"
  echo "Building $name..."
  docker build -t "hiresphere/$name:latest" "$service"
done
