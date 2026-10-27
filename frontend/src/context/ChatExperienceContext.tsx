import { createContext, useContext } from 'react'

/** true dans l'interface citoyen (CitizenShell) : pas de bloc « Sources utilisées ». */
export const HideChatSourcesContext = createContext(false)

export function useHideChatSources(): boolean {
  return useContext(HideChatSourcesContext)
}
