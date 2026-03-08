import { createContext, useCallback, useContext, useState } from 'react'

const STORAGE_KEY = 'latinum-user-name'
const MAX_USER_NAME_LENGTH = 80

type ProfileContextValue = {
  userName: string
  setUserName: (name: string) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

function readStoredName(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? ''
    return typeof raw === 'string' ? raw.trim().slice(0, MAX_USER_NAME_LENGTH) : ''
  } catch {
    return ''
  }
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [userName, setUserNameState] = useState(readStoredName)

  const setUserName = useCallback((name: string) => {
    const trimmed = (typeof name === 'string' ? name : '').trim().slice(0, MAX_USER_NAME_LENGTH)
    setUserNameState(trimmed)
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_KEY, trimmed)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore
    }
  }, [])

  return (
    <ProfileContext.Provider value={{ userName, setUserName }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
