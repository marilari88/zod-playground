import {createTheme, MantineProvider, virtualColor} from '@mantine/core'
import {Notifications} from '@mantine/notifications'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './main.css'

const theme = createTheme({
  fontFamily: 'Roboto, sans-serif',
  primaryColor: 'primary',
  colors: {
    'neutral-light': [
      '#FFFFFF',
      '#F5F5F5',
      '#EEEEEE',
      '#E0E0E0',
      '#BDBDBD',
      '#9E9E9E',
      '#757575',
      '#616161',
      '#424242',
      '#212121',
    ],
    'neutral-dark': [
      '#121212',
      '#1C1C1C',
      '#2C2C2C',
      '#3B3B3B',
      '#4A4A4A',
      '#5A5A5A',
      '#7A7A7A',
      '#B0B0B0',
      '#D0D0D0',
      '#E0E0E0',
    ],
    'primary-light': [
      '#eef3ff',
      '#dee2f2',
      '#bdc2de',
      '#98a0ca',
      '#7a84ba',
      '#6672b0',
      '#5c68ac',
      '#4c5897',
      '#424e88',
      '#364379',
    ],
    'primary-dark': [
      '#081F21',
      '#144D52',
      '#248994',
      '#2CA7B5',
      '#30B6C5',
      '#4AC6D3',
      '#6BD0DB',
      '#5BCBD7',
      '#7CD5DF',
      '#ADE6EB',
    ],
    neutral: virtualColor({
      name: 'neutral',
      dark: 'neutral-dark',
      light: 'neutral-light',
    }),
    primary: virtualColor({
      name: 'primary',
      dark: 'primary-dark',
      light: 'primary-light',
    }),
  },
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="auto" theme={theme}>
      <App />
      <Notifications position="bottom-right" />
    </MantineProvider>
  </React.StrictMode>,
)
