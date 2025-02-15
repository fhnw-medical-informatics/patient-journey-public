import { useCallback, useState } from 'react'
import { ColorByColumn } from '../color/colorSlice'
import { ColorByCategoryFn, ColorByColumnFn } from '../color/hooks'
import { useAppSelector } from '../store'

import {
  selectExpandByColumn,
  selectViewByColumn,
  selectShowFilteredOut,
  selectTimelineCluster,
  selectCursorPosition,
  selectSelectedActiveEvent,
  selectHoveredActiveEvent,
  selectShowTimeGrid,
  selectFilteredEventDataAsTimelineEvents,
  selectFilteredEventDataAsTimelineLanes,
  selectFilteredEventDataAsTimelineEventsWithoutColor,
  selectAllowInteraction,
  selectHoveredEntityLaneId,
  selectSelectedEntityLaneId,
  selectFilteredEventDataAsTimelineEventsForJourney,
  selectSortByState,
  selectTimelineDataColumns,
  selectTimelineSortDataColumns,
} from './selectors'

export const useTimelineCluster = () => useAppSelector(selectTimelineCluster)

export const useShowTimeGrid = () => useAppSelector(selectShowTimeGrid)

export const useAllowInteraction = () => useAppSelector(selectAllowInteraction)

export const useViewByColumn = () => useAppSelector(selectViewByColumn)

export const useExpandByColumn = () => useAppSelector(selectExpandByColumn)

export const useSortByState = () => useAppSelector(selectSortByState)

export const useShowFilteredOut = () => useAppSelector(selectShowFilteredOut)

export const useTimelineCursorPosition = () => useAppSelector(selectCursorPosition)

export const useActiveDataAsEvents = (colorByColumnFn: ColorByColumnFn, filteredOutColor: string) =>
  useAppSelector((state) => selectFilteredEventDataAsTimelineEvents(state, colorByColumnFn, filteredOutColor))

export const useActiveDataAsEventsForJourney = (colorByColumnFn: ColorByColumnFn, filteredOutColor: string) =>
  useAppSelector((state) => selectFilteredEventDataAsTimelineEventsForJourney(state, colorByColumnFn, filteredOutColor))

export const useActiveDataAsEventsWithoutColor = () =>
  useAppSelector(selectFilteredEventDataAsTimelineEventsWithoutColor)

export const useSelectedActiveEvent = (colorByColumnFn: ColorByColumnFn, filteredOutColor: string) =>
  useAppSelector((state) => selectSelectedActiveEvent(state, colorByColumnFn, filteredOutColor))

export const useHoveredActiveEvent = (colorByColumnFn: ColorByColumnFn, filteredOutColor: string) =>
  useAppSelector((state) => selectHoveredActiveEvent(state, colorByColumnFn, filteredOutColor))

export const useActiveDataAsLanes = (
  colorByColumnFn: ColorByColumnFn,
  colorByCategoryFn: ColorByCategoryFn,
  colorByColumn: ColorByColumn,
) =>
  useAppSelector((state) =>
    selectFilteredEventDataAsTimelineLanes(state, colorByColumnFn, colorByCategoryFn, colorByColumn),
  )

export const useHoveredLaneId = () => useAppSelector(selectHoveredEntityLaneId)
export const useSelectedLaneId = () => useAppSelector(selectSelectedEntityLaneId)

export type RenderInfo = { ctx: CanvasRenderingContext2D; canvas: HTMLCanvasElement }

export const useCanvas = () => {
  const [renderInfo, setRenderInfo] = useState<RenderInfo>()

  const canvasRef = useCallback(
    (canvasElement: HTMLCanvasElement) => {
      if (canvasElement) {
        const ctx = canvasElement.getContext('2d')
        if (ctx) {
          const renderInfo = {
            ctx,
            canvas: canvasElement,
          }
          setRenderInfo(renderInfo)
        }
      }
    },
    [setRenderInfo],
  )

  return { canvasRef, renderInfo }
}

export const useTimelineDataColumns = () => useAppSelector(selectTimelineDataColumns)
export const useTimelineSortDataColumns = () => useAppSelector(selectTimelineSortDataColumns)
