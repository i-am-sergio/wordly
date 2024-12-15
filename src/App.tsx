import './App.css'
import HandsCanvas from './components/HandsCanvas'
import ObjectDetection from './components/ObjectDetection'

function App() {

  return (
      <div
        style={{
          backgroundColor: '#000',
        }}
      >
        {/* <HandsCanvas /> */} {/* Camera + Hands detection */}
        <ObjectDetection /> {/* Camera + Object detection */}
      </div>
  )
}

export default App
