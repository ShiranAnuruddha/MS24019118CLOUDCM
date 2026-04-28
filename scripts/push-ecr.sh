#!/usr/bin/env bash
set -euo pipefail

AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:?Set AWS_ACCOUNT_ID}"
AWS_REGION="${AWS_REGION:-us-east-1}"
REPO_PREFIX="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$REPO_PREFIX"

images=(
  api-gateway
  profile-service
  booking-service
  submission-service
  messaging-service
  evaluation-service
  live-session-service
  frontend
)

for image in "${images[@]}"; do
  docker tag "hiresphere/${image}:latest" "${REPO_PREFIX}/${image}:latest"
  docker push "${REPO_PREFIX}/${image}:latest"
done
