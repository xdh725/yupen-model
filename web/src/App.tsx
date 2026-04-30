import { useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { useYupenStore } from './store/yupenStore'
import './index.css'

function App() {
  const { indices, availableDates, initializeDefaultIndices, loadSnapshotManifest } = useYupenStore()

  useEffect(() => {
    loadSnapshotManifest().catch(() => {
      if (indices.length === 0 && availableDates.length === 0) {
        initializeDefaultIndices()
      }
    })
  }, [])

  return <Dashboard />
}

export default App
