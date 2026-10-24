import { createContext, useContext } from 'react'
import { THEMES } from '../palette'

export const ThemeCtx = createContext(THEMES.day)
export const useTheme = () => useContext(ThemeCtx)
