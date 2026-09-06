#!/bin/bash
set -e

echo "==> CYBERMIND OS RC-002: Scalability Validation (WS4)"
echo "Starting load generation and monitoring HorizontalPodAutoscaler (HPA)..."

# Ensure k6 is installed
if ! command -v k6 &> /dev/null; then
    echo "k6 not found. Please install k6 first."
    exit 1
fi

# We will apply a burst load to trigger scaling
echo "Running k6 burst load test against gateway in the background..."
export TARGET_ENV="local"
k6 run -e TARGET_ENV=local -e SCENARIO=burst tests/load/k6-playbook.js > Evidence/RC2/k6-burst-results.txt 2>&1 &
K6_PID=$!

echo "Monitoring HPA for 'cybermind-gateway'..."
echo "Waiting for CPU utilization to rise and trigger scale-out (max 3 minutes)..."

# Monitor loop
END=$((SECONDS+180))
SCALED=0

while [ $SECONDS -lt $END ]; do
    HPA_OUT=$(kubectl get hpa cybermind-gateway -o jsonpath='{.status.currentReplicas},{.status.currentCPUUtilizationPercentage}')
    REPLICAS=$(echo $HPA_OUT | cut -d',' -f1)
    CPU=$(echo $HPA_OUT | cut -d',' -f2)
    
    echo "[$(date +'%H:%M:%S')] Gateway HPA | Replicas: ${REPLICAS:-1} | CPU: ${CPU:-0}%"
    
    if [ "${REPLICAS:-1}" -gt 2 ]; then
        echo "✅ SUCCESS: HPA successfully scaled out to ${REPLICAS} replicas!"
        SCALED=1
        break
    fi
    sleep 5
done

echo "Waiting for k6 load test to finish..."
wait $K6_PID || true

if [ $SCALED -eq 1 ]; then
    echo "==> Autoscaling Validation PASSED."
    exit 0
else
    echo "❌ FAILED: HPA did not scale out within the timeframe."
    echo "Current HPA state:"
    kubectl describe hpa cybermind-gateway
    exit 1
fi
