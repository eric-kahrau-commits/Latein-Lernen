import { createContext, useContext, useState, type ReactNode } from 'react'

type InLessonContextValue = {
  inLesson: boolean
  setInLesson: (value: boolean) => void
}

const InLessonContext = createContext<InLessonContextValue | null>(null)

export function InLessonProvider({ children }: { children: ReactNode }) {
  const [inLesson, setInLesson] = useState(false)
  return (
    <InLessonContext.Provider value={{ inLesson, setInLesson }}>
      {children}
    </InLessonContext.Provider>
  )
}

export function useInLesson(): InLessonContextValue {
  const ctx = useContext(InLessonContext)
  if (!ctx) {
    return {
      inLesson: false,
      setInLesson: () => {},
    }
  }
  return ctx
}
