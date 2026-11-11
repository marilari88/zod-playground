import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    rolldownOptions: {
      output: {
        // Monaco's registrations depend on module execution order.
        strictExecutionOrder: true,
        codeSplitting: {
          // Rolldown measures module sizes before minification.
          maxSize: 1_000_000,
          groups: [
            {
              name: 'monaco',
              test: /node_modules[\\/]monaco-editor[\\/]/,
              entriesAware: true,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              entriesAware: true,
            },
          ],
        },
      },
    },
  },
})
