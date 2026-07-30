#!/bin/bash
# Sprint 12B Benchmarking Script

echo "Installing autocannon (if not exists)..."
npm install -g autocannon > /dev/null 2>&1

echo "====================================="
echo " CYBERMIND AI Baseline Benchmarks"
echo "====================================="

echo "[1/2] Benchmarking Health Endpoint (/health)..."
# Simple fast endpoint, tests max throughput of the web server
autocannon -c 100 -d 10 -p 10 http://localhost:3000/health

echo ""
echo "[2/2] Benchmarking Chat-to-Graph Endpoint (/api/retrieval/ask)..."
# More complex endpoint involving AI Gateway routing & Retrieval pipeline
# Note: In a live test this would hit the LLM providers.
autocannon -c 10 -d 10 -p 2 \
  --method POST \
  --headers "Content-Type: application/json" \
  --headers "Authorization: Bearer TEST_TOKEN" \
  --body '{"query": "Who is APT29?"}' \
  http://localhost:3000/api/retrieval/ask

echo "====================================="
echo " Benchmarking Complete."
echo " Save these results to compare against future RC builds."
echo "====================================="
