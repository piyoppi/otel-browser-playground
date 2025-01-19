// ref: https://opentelemetry.io/docs/languages/js/getting-started/browser/
import {
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { ZoneContextManager } from '@opentelemetry/context-zone'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource, browserDetector } from '@opentelemetry/resources'
import { detectResourcesSync } from '@opentelemetry/resources/build/src/detect-resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'

const exporter = new OTLPTraceExporter({
  url: 'http://localhost:55681/v1/traces',
});

let resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: 'sample-frontend',
});

const detectedResources = detectResourcesSync({ detectors: [browserDetector] });
resource = resource.merge(detectedResources);

const provider = new WebTracerProvider({
  resource,
  spanProcessors: [new SimpleSpanProcessor(exporter)],
});

provider.register({
  contextManager: new ZoneContextManager(),
})

registerInstrumentations({
  instrumentations: [
    new DocumentLoadInstrumentation(),
    new FetchInstrumentation({
      propagateTraceHeaderCorsUrls: [
        'http://localhost:5174',
      ],
    }),
  ],
})


// ----------------------------------------------------

await fetch('/test')
