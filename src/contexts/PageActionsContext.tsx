'use client'
import { createContext, useContext, useState, type ReactNode } from 'react'

interface PageActionsContextType {
  actions: ReactNode
  setActions: (actions: ReactNode) => void
  headerSearch: ReactNode
  setHeaderSearch: (node: ReactNode) => void
  headerTabs: ReactNode
  setHeaderTabs: (node: ReactNode) => void
}

const PageActionsContext = createContext<PageActionsContextType>({
  actions: null,
  setActions: () => {},
  headerSearch: null,
  setHeaderSearch: () => {},
  headerTabs: null,
  setHeaderTabs: () => {},
})

export function PageActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode>(null)
  const [headerSearch, setHeaderSearch] = useState<ReactNode>(null)
  const [headerTabs, setHeaderTabs] = useState<ReactNode>(null)
  return (
    <PageActionsContext.Provider value={{ actions, setActions, headerSearch, setHeaderSearch, headerTabs, setHeaderTabs }}>
      {children}
    </PageActionsContext.Provider>
  )
}

export const usePageActions = () => useContext(PageActionsContext)
