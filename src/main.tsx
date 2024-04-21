import {MantineProvider, createTheme, virtualColor} from '@mantine/core'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

import '@mantine/core/styles.css'

const theme = createTheme({
  fontFamily: 'Roboto, sans-serif',
  colors: {
    primary: virtualColor({
      name: 'primary',
      dark: 'yellow',
      light: 'blue',
    }),
  },
  defaultRadius: 'md',
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <App />
    </MantineProvider>
  </React.StrictMode>,
)
