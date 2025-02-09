import React from 'react'

import { App } from './app/containers/App'
import { Provider } from 'react-redux'
import { store } from './store'
import { createRoot } from 'react-dom/client'

const Root = () => (
  <Provider store={store}>
    <App />
  </Provider>
)
const container = document.getElementById('root')

if (!container) {
  throw new Error('No root element found')
}

const root = createRoot(container)
root.render(<Root />)
