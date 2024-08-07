import { createSlice, Draft, PayloadAction } from '@reduxjs/toolkit'
import { EventDataColumn } from '../data/events'
import { PatientDataColumn } from '../data/patients'
import { Brushing, BrushMode, BrushSemantics } from './model'

export const DEFAULT_PLOT_X_AXIS_COLUMN_NAME = '2D X'
export const DEFAULT_PLOT_Y_AXIS_COLUMN_NAME = '2D Y'

export type ScatterPlotAxisColumn = PatientDataColumn | EventDataColumn | NoPlotColumn

export const PlotColumnNone = 'n/a'
export type NoPlotColumn = typeof PlotColumnNone

export interface ScatterPlotState {
  readonly xAxisColumn: ScatterPlotAxisColumn
  readonly yAxisColumn: ScatterPlotAxisColumn
  readonly brushing: Brushing
  readonly showFilteredOut: boolean
}

export interface PlotState {
  scatterPlot: ScatterPlotState
}

const initialState: PlotState = {
  scatterPlot: {
    xAxisColumn: PlotColumnNone,
    yAxisColumn: PlotColumnNone,
    brushing: { brushMode: 'off', brushSemantics: 'add' },
    showFilteredOut: true,
  },
}

export const plotSlice = createSlice({
  name: 'plot',
  initialState,
  reducers: {
    setScatterPlotXAxisColumn: (state: Draft<PlotState>, action: PayloadAction<ScatterPlotAxisColumn>) => {
      state.scatterPlot.xAxisColumn = action.payload
    },
    setScatterPlotYAxisColumn: (state: Draft<PlotState>, action: PayloadAction<ScatterPlotAxisColumn>) => {
      state.scatterPlot.yAxisColumn = action.payload
    },
    setBrushMode: (state: Draft<PlotState>, action: PayloadAction<BrushMode>) => {
      state.scatterPlot.brushing.brushMode = action.payload
    },
    setBrushSemantics: (state: Draft<PlotState>, action: PayloadAction<BrushSemantics>) => {
      state.scatterPlot.brushing.brushSemantics = action.payload
    },
    setShowFilteredOut: (state: Draft<PlotState>) => {
      state.scatterPlot.showFilteredOut = !state.scatterPlot.showFilteredOut
    },
  },
})

export const plotReducer = plotSlice.reducer

export const {
  setScatterPlotXAxisColumn,
  setScatterPlotYAxisColumn,
  setBrushMode,
  setBrushSemantics,
  setShowFilteredOut,
} = plotSlice.actions
