import babel from '@rolldown/plugin-babel'
import react, {reactCompilerPreset} from '@vitejs/plugin-react'
import {defineConfig} from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
  build: {
    target: 'es2022',
  },
})
