import { EntityId } from '../data/entities'

export interface ScatterPlotData {
  readonly xAxisLabel: string
  readonly yAxisLabel: string
  readonly data: ScatterPlotDataSeries[] // nivo prefers mutability
}

export interface ScatterPlotDataSeries {
  readonly id: string
  readonly data: ScatterPlotDatum[] // nivo prefers mutability
}

export interface ScatterPlotDatum {
  readonly entityId: EntityId
  readonly x: number | string | Date
  readonly y: number | string | Date
  readonly color: string
  readonly isFilteredOut: boolean
}

export type ScatterPlotInfo =
  | 'none'
  | {
      readonly xAxisLabel: string
      readonly xValueFormatted: string
      readonly yAxisLabel: string
      readonly yValueFormatted: string
    }

export const BRUSH_MODE_ON = 'on'
export const BRUSH_MODE_OFF = 'off'

export type BrushMode = typeof BRUSH_MODE_ON | typeof BRUSH_MODE_OFF

export const BRUSH_MODE_SEMANTICS_ADD = 'add'
export const BRUSH_MODE_SEMANTICS_SUBTRACT = 'subtract'

export type BrushSemantics = typeof BRUSH_MODE_SEMANTICS_ADD | typeof BRUSH_MODE_SEMANTICS_SUBTRACT

export interface Brushing {
  readonly brushMode: BrushMode
  readonly brushSemantics: BrushSemantics
}
