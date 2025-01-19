// ref: https://opentelemetry.io/docs/languages/js/getting-started/browser/

import { BatchSpanProcessor, WebTracerProvider } from '@opentelemetry/sdk-trace-web'
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request'
import { ZoneContextManager } from '@opentelemetry/context-zone'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { Resource, browserDetector } from '@opentelemetry/resources'
import { detectResourcesSync } from '@opentelemetry/resources/build/src/detect-resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
//import { propagation } from '@opentelemetry/api'
//import { W3CTraceContextPropagator } from "@opentelemetry/core"

//propagation.setGlobalPropagator(new W3CTraceContextPropagator())

const exporter = new OTLPTraceExporter({
  url: 'http://localhost:55681/v1/traces',
});

let resource = new Resource({
  [ATTR_SERVICE_NAME]: 'my-service-frontend',
});

const detectedResources = detectResourcesSync({ detectors: [browserDetector] });
resource = resource.merge(detectedResources);

const provider = new WebTracerProvider({
  resource,
  spanProcessors: [new BatchSpanProcessor(exporter)],
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
    new XMLHttpRequestInstrumentation({
      propagateTraceHeaderCorsUrls: [
        'http://localhost:5174',
      ],
    }),
  ],
})

// ----------------------------------------------------

await fetch('/api/test')

// ----------------------------------------------------

const xhr = new XMLHttpRequest();
xhr.open('GET', 'http://localhost:5174/api/test2', true);

xhr.onreadystatechange = function () {
  if (xhr.readyState === 4) {
    if (xhr.status === 200) {
      console.log('Response:', xhr.responseText);
    } else {
      console.error('Error:', xhr.statusText);
    }
  }
};

xhr.send();

