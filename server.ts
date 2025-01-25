import fs from 'node:fs'
import path from 'node:path'
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
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { Resource } from '@opentelemetry/resources'

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

//const tracer = trace.getTracer('example')

const app = new Hono()

app.use('/', async ({html}) => {
  let template = fs.readFileSync(
    path.resolve(__dirname, 'index.html'),
    'utf-8',
  )

  //const span = trace.getSpan(context.active())
  const span = trace.getActiveSpan()
  console.log(span)
  //if (span) {
  //  const traceparent = `00-${span.spanContext().traceId}-${span.spanContext().spanId}-01`;
  //  template = template.replace(`<!--traceparent-->`, () => traceparent)
  //}

  return html(template)
})

app.use('/api/test', async ({json}) => {
  await fetch('https://garakuta-toolbox.com/rss.xml')

  await new Promise((resolve) => setTimeout(resolve, 1000))

  return json({message: 'test'})
})

//app.use('/api/test2', async ({json}) => {
//  await fetch('https://garakuta-toolbox.com/rss.xml')
//
//  const activeContext = context.active()
//  const span = tracer.startSpan('wait', { kind: 1 }, activeContext)
//  span.setAttribute('duration', '1000')
//  await new Promise((resolve) => setTimeout(resolve, 1000))
//  span.end()
//
//  await fetch('https://garakuta-toolbox.com/rss2.xml')
//
//  return json({message: 'test'})
//})

export default app
