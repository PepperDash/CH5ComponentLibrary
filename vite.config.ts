import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [ dts({include: ['src']})],
  build: {
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
    }
  }
})
