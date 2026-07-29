# ADR-0002: Event Streaming (Redpanda)

**Status:** Accepted
**Date:** 2026-07-28

## Context
The platform heavily relies on an Event Bus to decouple operational domains (e.g., SIEM producing alerts, SOC consuming them). We need a high-throughput, Kafka-compatible event streaming platform.

## Decision
We will use **Redpanda** as the event streaming backbone.

## Consequences
- **Positive:** Fully Kafka-compatible API, meaning we can use existing Kafka SDKs (KafkaJS). Eliminates the need for ZooKeeper. Lower latency and hardware requirements than standard JVM Kafka.
- **Negative:** Newer technology than Apache Kafka, potentially fewer enterprise support avenues.
- **Mitigation:** Redpanda's Kafka API compatibility ensures we can seamlessly fallback to Managed Kafka (MSK/Confluent) if necessary without changing code.
