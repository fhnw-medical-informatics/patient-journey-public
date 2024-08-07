import { ScatterPlot as ScatterPlotComponent } from '../components/ScatterPlot'
import {
  useActiveScatterPlotXAxisColumn,
  useActiveScatterPlotYAxisColumn,
  useScatterPlotBrushing,
  useScatterPlotData,
  useScatterPlotPatientDataColumns,
  useScatterPlotShowFilteredOut,
} from '../hooks'
import { useCallback, useEffect, useMemo } from 'react'
import {
  useAllCategoricalPatientDataColumns,
  useEntityInteraction,
  useHoveredEntity,
  useIndexPatientId,
  usePatientCohort,
  useSelectedEntity,
} from '../../data/hooks'
import { useDispatch } from 'react-redux'
import {
  PlotColumnNone,
  ScatterPlotAxisColumn,
  setScatterPlotXAxisColumn,
  setScatterPlotYAxisColumn,
  setShowFilteredOut,
  DEFAULT_PLOT_X_AXIS_COLUMN_NAME,
  DEFAULT_PLOT_Y_AXIS_COLUMN_NAME,
} from '../plotSlice'
import { ScaleSpec } from '@nivo/scales/dist/types/types'
import { addToCohort, removeFromCohort } from '../../data/dataSlice'
import { PatientId } from '../../data/patients'
import { useColor } from '../../color/hooks'
import { useCustomTheme } from '../../theme/useCustomTheme'

// scatter plot exclusively shows patients
const ENTITY_TYPE = 'patients'

export const ScatterPlot = () => {
  const { colorByColumnFn } = useColor(ENTITY_TYPE)
  const theme = useCustomTheme()
  const data = useScatterPlotData(colorByColumnFn, theme.entityColors.filteredOut)
  const xAxisColumn = useActiveScatterPlotXAxisColumn()
  const yAxisColumn = useActiveScatterPlotYAxisColumn()
  const hoveredEntity = useHoveredEntity()
  const selectedEntity = useSelectedEntity()
  const indexPatientId = useIndexPatientId()
  const { onEntityHover, onEntityClick } = useEntityInteraction(ENTITY_TYPE)
  const brushing = useScatterPlotBrushing()
  const cohortPatientIds = usePatientCohort()
  const showFilteredOut = useScatterPlotShowFilteredOut()

  const dispatch = useDispatch()

  const onUpdateCohort = useCallback(
    (ids: ReadonlySet<PatientId>) => {
      if (ids.size > 0) {
        if (brushing.brushSemantics === 'add') {
          dispatch(addToCohort(ids))
        } else if (brushing.brushSemantics === 'subtract') {
          dispatch(removeFromCohort(ids))
        }
      }
    },
    [brushing.brushSemantics, dispatch],
  )
  const onPlotClick = useCallback(() => {
    if (brushing.brushMode === 'off') {
      onEntityClick(hoveredEntity.uid)
    } else {
      onUpdateCohort(new Set([hoveredEntity.uid]))
    }
  }, [brushing.brushMode, onEntityClick, hoveredEntity.uid, onUpdateCohort])

  const allSelectablePatientColumns = useScatterPlotPatientDataColumns()
  const colorByColumns = useAllCategoricalPatientDataColumns()

  const getScaleConfig = useCallback((column: ScatterPlotAxisColumn): ScaleSpec => {
    if (column === PlotColumnNone) {
      return { type: 'linear', min: 'auto', max: 'auto' }
    } else {
      switch (column.type) {
        case 'pid':
        case 'eid':
        case 'boolean':
        case 'category':
        case 'string':
          return { type: 'point' }
        case 'number':
          return { type: 'linear', min: 'auto', max: 'auto' }
        case 'date':
        case 'timestamp':
          return { type: 'time', format: 'native', min: 'auto', max: 'auto', precision: 'millisecond' }
        default:
          return { type: 'linear', min: 'auto', max: 'auto' }
      }
    }
  }, [])

  const xScaleConfig = useMemo(() => getScaleConfig(xAxisColumn), [getScaleConfig, xAxisColumn])
  const yScaleConfig = useMemo(() => getScaleConfig(yAxisColumn), [getScaleConfig, yAxisColumn])

  useEffect(() => {
    dispatch(
      setScatterPlotXAxisColumn(
        allSelectablePatientColumns.find((c) => c.name === DEFAULT_PLOT_X_AXIS_COLUMN_NAME) ?? PlotColumnNone,
      ),
    )
    dispatch(
      setScatterPlotYAxisColumn(
        allSelectablePatientColumns.find((c) => c.name === DEFAULT_PLOT_Y_AXIS_COLUMN_NAME) ?? PlotColumnNone,
      ),
    )
  }, [dispatch, allSelectablePatientColumns, colorByColumns])

  const onSetShowFilteredOut = useCallback(() => dispatch(setShowFilteredOut()), [dispatch])

  return (
    <ScatterPlotComponent
      {...data}
      xScaleConfig={xScaleConfig}
      yScaleConfig={yScaleConfig}
      hoveredEntity={hoveredEntity.uid}
      selectedEntity={selectedEntity.uid}
      indexPatientId={indexPatientId}
      brushing={brushing}
      cohortPatientIds={cohortPatientIds}
      showFilteredOut={showFilteredOut}
      onUpdateCohort={onUpdateCohort}
      onEntityHover={onEntityHover}
      onPlotClick={onPlotClick}
      onSetShowFilteredOut={onSetShowFilteredOut}
    />
  )
}
