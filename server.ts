import fs from 'node:fs'
import path, { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Hono } from 'hono'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { context, trace } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import {
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import {
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:55681/v1/traces',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
})

sdk.start()

const app = new Hono()

app.use('/', async ({html}) => {
  let template = fs.readFileSync(
    path.resolve(__dirname, 'index.html'),
    'utf-8',
  )

  const span = trace.getSpan(context.active())
  if (span) {
    const traceparent = `00-${span.spanContext().traceId}-${span.spanContext().spanId}-01`;
    template = template.replace(`<!--traceparent-->`, () => traceparent)
  }

  return html(template)
})

app.use('/test', async ({json}) => {
  await fetch('https://garakuta-toolbox.com/rss.xml')

  await new Promise((resolve) => setTimeout(resolve, 1000))

  return json({message: 'test'})
})

export default app
