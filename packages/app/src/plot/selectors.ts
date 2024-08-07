import { RootState } from '../store'
import { createSelector } from '@reduxjs/toolkit'
import { ScatterPlotData, ScatterPlotDatum, ScatterPlotInfo } from './model'
import {
  selectCrossFilteredPatientData,
  selectFocusEntity,
  selectPatientDataColumns,
  selectPatientDataRowMap,
  selectPatientDataRows,
} from '../data/selectors'
import { PlotColumnNone } from './plotSlice'
import { extractColumnValueSafe, formatColumnValue } from '../data/columns'
import { EventDataColumn } from '../data/events'
import { PatientDataColumn } from '../data/patients'
import { ColorByColumnFn } from '../color/hooks'

export const selectScatterPlotPatientDataColumns = createSelector(selectPatientDataColumns, (columns) => columns)

export const selectScatterPlotState = (s: RootState) => s.plot.scatterPlot

export const selectShowFilteredOut = (s: RootState): boolean => s.plot.scatterPlot.showFilteredOut

export const selectPatientData = createSelector(
  selectPatientDataRows,
  selectCrossFilteredPatientData,
  selectShowFilteredOut,
  (allRows, filteredRows, showFilteredOut) => (showFilteredOut ? allRows : filteredRows),
)

export const selectFilteredOutPatientIds = createSelector(
  selectPatientDataRows,
  selectCrossFilteredPatientData,
  (allRows, filteredRows) => {
    const filteredIn = new Set(filteredRows.map((p) => p.uid))
    return new Set(allRows.flatMap((p) => (!filteredIn.has(p.uid) ? [p.uid] : [])))
  },
)

export const selectScatterPlotData = (colorFn: ColorByColumnFn, filteredOutColor: string) =>
  createSelector(
    selectPatientData,
    selectFilteredOutPatientIds,
    selectScatterPlotState,
    (patientData, filteredOutIds, plotState): ScatterPlotData => {
      if (plotState.xAxisColumn === PlotColumnNone || plotState.yAxisColumn === PlotColumnNone) {
        return { xAxisLabel: '', yAxisLabel: '', data: [] }
      } else {
        const xCol: PatientDataColumn | EventDataColumn = plotState.xAxisColumn
        const yCol: PatientDataColumn | EventDataColumn = plotState.yAxisColumn
        const data = patientData.flatMap<ScatterPlotDatum>((entity) => {
          const xSafe = extractColumnValueSafe(xCol)(entity)
          const ySafe = extractColumnValueSafe(yCol)(entity)

          if (xSafe.length === 0 || ySafe.length === 0) {
            return []
          } else {
            const isFilteredOut = filteredOutIds.has(entity.uid)
            return {
              entityId: entity.uid,
              x: xSafe[0],
              y: ySafe[0],
              color: isFilteredOut ? filteredOutColor : colorFn(entity),
              isFilteredOut,
            }
          }
        })
        return { xAxisLabel: xCol.name, yAxisLabel: yCol.name, data: [{ id: '', data }] }
      }
    },
  )

export const selectActiveScatterPlotXAxisColumn = createSelector(selectScatterPlotState, (s) => s.xAxisColumn)
export const selectActiveScatterPlotYAxisColumn = createSelector(selectScatterPlotState, (s) => s.yAxisColumn)

export const selectScatterPlotInfo = createSelector(
  selectScatterPlotState,
  selectPatientDataRowMap,
  selectFocusEntity,
  (state, dataByIdMap, focusEntity): ScatterPlotInfo => {
    if (state.xAxisColumn === PlotColumnNone || state.yAxisColumn === PlotColumnNone) {
      return 'none'
    } else {
      const data = dataByIdMap.get(focusEntity.uid)
      if (data) {
        const x = data.values[state.xAxisColumn.index]
        const y = data.values[state.yAxisColumn.index]
        return {
          xAxisLabel: state.xAxisColumn.name,
          yAxisLabel: state.yAxisColumn.name,
          xValueFormatted: formatColumnValue(state.xAxisColumn.type)(x),
          yValueFormatted: formatColumnValue(state.yAxisColumn.type)(y),
        }
      } else {
        return 'none'
      }
    }
  },
)

export const selectScatterPlotBrushing = createSelector(selectScatterPlotState, (s) => s.brushing)
