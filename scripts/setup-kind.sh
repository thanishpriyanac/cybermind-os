#!/bin/bash
set -eo pipefail

echo "==> Setting up Kubernetes (kind) for RC-002 Validation"

mkdir -p ~/.local/bin

# Ensure kind is installed
if ! command -v kind &> /dev/null; then
    echo "kind not found. Installing..."
    curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.22.0/kind-linux-amd64
    chmod +x ./kind
    mv ./kind ~/.local/bin/kind
fi

# Ensure kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "kubectl not found. Installing..."
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    chmod +x kubectl
    mv kubectl ~/.local/bin/
fi

export PATH="$HOME/.local/bin:$PATH"

CLUSTER_NAME="cybermind-rc002"

if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "Cluster ${CLUSTER_NAME} already exists. Skipping creation."
else
    echo "Creating kind cluster: ${CLUSTER_NAME}"
    kind create cluster --name "${CLUSTER_NAME}"
fi

echo "==> Waiting for cluster to be ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=60s

echo "==> Installing Kubernetes Metrics Server..."
# Install metrics-server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Patch metrics-server to allow insecure TLS (required for kind)
kubectl patch -n kube-system deployment metrics-server --type=json \
  -p '[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'

echo "==> Waiting for Metrics Server to be available..."
kubectl rollout status deployment/metrics-server -n kube-system --timeout=120s

echo "==> Setup complete!"
kubectl top node || echo "Metrics might take a minute to populate..."
