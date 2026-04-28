## Kubernetes Apply Order

```bash
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secret.example.yaml
# optional local-only database for test clusters
kubectl apply -f postgres-local-dev.yaml
kubectl apply -f profile-service.yaml
kubectl apply -f booking-service.yaml
kubectl apply -f submission-service.yaml
kubectl apply -f messaging-service.yaml
kubectl apply -f evaluation-service.yaml
kubectl apply -f live-session-service.yaml
kubectl apply -f api-gateway.yaml
kubectl apply -f frontend.yaml
```

Update all `YOUR_ECR/...` image values first.
