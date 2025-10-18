import './App.css'
import { AppProvider } from './context/AppContext'
import { CanvasProvider } from './context/CanvasContext'
import { MainLayout } from './components/Layout/MainLayout'

function App() {
  return (
    <AppProvider>
      <CanvasProvider>
        <div className="app">
          <MainLayout />
        </div>
      </CanvasProvider>
    </AppProvider>
  )
}

export default App