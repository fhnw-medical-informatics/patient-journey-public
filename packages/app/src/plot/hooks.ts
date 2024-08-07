import {
  selectActiveScatterPlotXAxisColumn,
  selectActiveScatterPlotYAxisColumn,
  selectScatterPlotBrushing,
  selectScatterPlotData,
  selectScatterPlotInfo,
  selectScatterPlotPatientDataColumns,
  selectShowFilteredOut,
} from './selectors'
import { useAppSelector } from '../store'
import { ColorByColumnFn } from '../color/hooks'

export const useScatterPlotData = (colorByColumnFn: ColorByColumnFn, filteredOutColor: string) =>
  useAppSelector(selectScatterPlotData(colorByColumnFn, filteredOutColor))

export const useScatterPlotPatientDataColumns = () => useAppSelector(selectScatterPlotPatientDataColumns)

export const useActiveScatterPlotXAxisColumn = () => useAppSelector(selectActiveScatterPlotXAxisColumn)
export const useActiveScatterPlotYAxisColumn = () => useAppSelector(selectActiveScatterPlotYAxisColumn)

export const useScatterPlotInfo = () => useAppSelector(selectScatterPlotInfo)

export const useScatterPlotBrushing = () => useAppSelector(selectScatterPlotBrushing)

export const useScatterPlotShowFilteredOut = () => useAppSelector(selectShowFilteredOut)
