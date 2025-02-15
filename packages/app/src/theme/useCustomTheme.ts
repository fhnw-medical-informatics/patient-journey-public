import { createTheme, darken, lighten, Theme } from '@mui/material'
import { useAppSelector } from '../store'
import { amber, grey, pink, red, yellow } from '@mui/material/colors'
import { AppTheme } from './themeSlice'

declare module '@mui/material/styles' {
  interface Theme {
    entityColors: {
      default: string
      filteredOut: string
      selected: string
      indexPatient: string
      stroke: string
      journeyStroke: string
      cohort: string
    }
  }

  // allow configuration using `createTheme`
  // noinspection JSUnusedGlobalSymbols
  interface ThemeOptions {
    entityColors?: {
      default?: string
      filteredOut?: string
      selected?: string
      indexPatient?: string
      stroke?: string
      journeyStroke?: string
      cohort?: string
    }
  }
}

const createCustomTheme = (mode: AppTheme, selectionColor: string, defaultColor: string) =>
  createTheme({
    palette: {
      mode,
      background: {
        default: mode === 'light' ? grey[200] : grey[800],
        paper: mode === 'light' ? grey[50] : grey[900],
      },
    },
    entityColors: {
      default: defaultColor,
      filteredOut: mode === 'light' ? grey[300] : grey[800],
      selected: selectionColor,
      indexPatient: mode === 'light' ? amber[500] : yellow[700],
      journeyStroke: selectionColor,
      cohort: '#90caf9',
    },
    components: {
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&.MuiTableRow-hover': {
              '&:hover': {
                backgroundColor: selectionColor,
              },
            },
            '&.Mui-selected': {
              backgroundColor: selectionColor,
            },
          },
        },
      },
    },
  })

const LIGHT_SELECTION_COLOR = pink[500]
const DARK_SELECTION_COLOR = red['A200']

const LIGHT_DEFAULT_COLOR = grey[500]
const DARK_DEFAULT_COLOR = grey[600]

export const lightTheme = createCustomTheme('light', LIGHT_SELECTION_COLOR, LIGHT_DEFAULT_COLOR)
export const darkTheme = createCustomTheme('dark', DARK_SELECTION_COLOR, DARK_DEFAULT_COLOR)

export const useCustomTheme = () =>
  useAppSelector<Theme>((s) => {
    return s.theme === 'light' ? lightTheme : darkTheme
  })

export const LIGHTENING_FACTOR = 0.3
export const DARKENING_FACTOR = 0.3

export const createFocusColor = (theme: Theme, color: string) =>
  theme.palette.mode === 'dark' ? lighten(color, LIGHTENING_FACTOR) : darken(color, DARKENING_FACTOR)
