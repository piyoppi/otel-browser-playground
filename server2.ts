import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { context, trace } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import {
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { Resource } from '@opentelemetry/resources'
import express from 'express'
import { createServer as createViteServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const sdk = new NodeSDK({
  resource: new Resource ({
    [ATTR_SERVICE_NAME]: 'my-service-backend',
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:55681/v1/traces',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
})

sdk.start()

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'custom'
})

const app = express()

app.use(vite.middlewares)

app.get('/', async (_req, res) => {
  let template = fs.readFileSync(
    path.resolve(__dirname, 'index.html'),
    'utf-8',
  )

  await new Promise((resolve) => setTimeout(resolve, 500))
  //const span = trace.getSpan(context.active())
  const span = trace.getActiveSpan()
  console.log(span)
  //if (span) {
  //  const traceparent = `00-${span.spanContext().traceId}-${span.spanContext().spanId}-01`;
  //  template = template.replace(`<!--traceparent-->`, () => traceparent)
  //}

  res.send(template)
})

app.get('/api/test', async (_req, res) => {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  res.json({message: 'test'})
})

app.listen(5174)
