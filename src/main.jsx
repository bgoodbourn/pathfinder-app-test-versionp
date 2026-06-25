import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles.css'
import { ScenarioProvider } from './data/ScenarioContext.jsx'
import { LayoutRouter } from './LayoutRouter.jsx'

// Composition root: the data-layer provider wraps the layout router, which
// picks the desktop binder or the mobile shell. Kept here (not in App.jsx) so
// App.jsx ↔ LayoutRouter.jsx don't form an import cycle.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ScenarioProvider>
      <LayoutRouter />
    </ScenarioProvider>
  </StrictMode>,
)
