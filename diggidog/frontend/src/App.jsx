import { useState } from 'react'
import './App.css'
import CreateCompetitionForm from './components/CreateCompetitionForm'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <p>Hello welcome to my diggidog</p>

      <CreateCompetitionForm/>
    </>
  )
}

export default App
