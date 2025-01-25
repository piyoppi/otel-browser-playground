import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'

export default defineConfig({
  server: {
    host: 'localhost',
    port: 5174,
  },
  plugins: [
    //devServer({
    //  entry: 'server.ts',
    //}),
  ],
})
