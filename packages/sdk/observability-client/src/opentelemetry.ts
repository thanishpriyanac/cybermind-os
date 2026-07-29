import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

let sdk: NodeSDK | null = null;

export function initializeOpenTelemetry(serviceName: string) {
  if (sdk) return; // Already initialized

  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTLP_TRACE_URL || 'http://jaeger:4318/v1/traces',
  });

  const metricExporter = new OTLPMetricExporter({
    url: process.env.OTLP_METRICS_URL || 'http://prometheus:4318/v1/metrics',
  });

  sdk = new NodeSDK({
    serviceName,
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 10000,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  process.on('SIGTERM', () => {
    sdk?.shutdown().finally(() => process.exit(0));
  });
}
