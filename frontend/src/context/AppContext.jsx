import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AppContext = createContext()

export function AppProvider({ children }) {
  const [user, setUser]               = useState(null)
  const [aiResult, setAiResult]       = useState(null)
  const [txnData, setTxnData]         = useState(null)
  const [cibilData, setCibilData]     = useState(null)
  const [emiOptions, setEmiOptions]   = useState([])
  const [matchedLenders, setMatchedLenders] = useState([])
  const [applicationId, setApplicationId]   = useState(null)
  const [selectedLender, setSelectedLender] = useState(null)
  const [selectedEMI, setSelectedEMI]       = useState(null)
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const saved = localStorage.getItem('user')
    if (token && saved) {
      try { setUser(JSON.parse(saved)) } catch {}
    }
  }, [])

  const login = (token, userData) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AppContext.Provider value={{
      user, login, logout,
      aiResult, setAiResult,
      txnData, setTxnData,
      cibilData, setCibilData,
      emiOptions, setEmiOptions,
      matchedLenders, setMatchedLenders,
      applicationId, setApplicationId,
      selectedLender, setSelectedLender,
      selectedEMI, setSelectedEMI,
      loading, setLoading,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
