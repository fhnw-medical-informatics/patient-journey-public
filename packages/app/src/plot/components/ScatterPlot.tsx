import React, { useCallback, useState } from 'react'
import { alpha, FormControlLabel, Grid, Paper, Switch } from '@mui/material'
import { Brushing, ScatterPlotData, ScatterPlotDatum } from '../model'
import { ScatterPlotCanvas, ScatterPlotCustomCanvasLayer, ScatterPlotMouseHandler } from '@nivo/scatterplot'
import AutoSizer, { Size } from 'react-virtualized-auto-sizer'
import { createFocusColor, useCustomTheme } from '../../theme/useCustomTheme'
import { ScatterPlotLayerProps, ScatterPlotNodeData } from '@nivo/scatterplot/dist/types/types'
import { ScaleSpec } from '@nivo/scales/dist/types/types'
import { EntityId, EntityIdNone } from '../../data/entities'
import { PatientId } from '../../data/patients'
import { changeCanvasFillStyle, noOp } from '../../utils'
import { getRelativeCursor } from '@nivo/core'
import { BrushControls } from '../containers/BrushControls'

const ACTIVE_NODE_SCALE_FACTOR = 1.2
const MARGIN = { top: 10, right: 20, bottom: 50, left: 70 }

const sxRoot = {
  width: 1,
  height: 1,
  padding: '10px',
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  cursor: 'pointer',
}

const sxToolbar = {
  display: 'grid',
  p: 2,
  lineHeight: 1,
  gridTemplateColumns: 'auto auto',
  justifyContent: 'space-between',
  alignItems: 'center',
}

export interface Props extends ScatterPlotData {
  readonly xScaleConfig: ScaleSpec
  readonly yScaleConfig: ScaleSpec
  readonly hoveredEntity: EntityId
  readonly selectedEntity: EntityId
  readonly indexPatientId: PatientId
  readonly brushing: Brushing
  readonly cohortPatientIds: ReadonlySet<PatientId>
  readonly showFilteredOut: boolean
  readonly onEntityHover: (id: EntityId) => void
  readonly onPlotClick: () => void
  readonly onUpdateCohort: (ids: ReadonlySet<EntityId>) => void
  readonly onSetShowFilteredOut: () => void
}

export const ScatterPlot = ({
  xAxisLabel,
  yAxisLabel,
  data,
  xScaleConfig,
  yScaleConfig,
  hoveredEntity,
  selectedEntity,
  indexPatientId,
  brushing,
  cohortPatientIds,
  showFilteredOut,
  onEntityHover,
  onPlotClick,
  onUpdateCohort,
  onSetShowFilteredOut,
}: Props) => {
  const theme = useCustomTheme()

  const [mouseEvent, setMouseEvent] = useState<React.MouseEvent | 'outside-of-canvas'>('outside-of-canvas')

  const selectedColor = createFocusColor(theme, theme.entityColors.selected)
  const hoveredColor = createFocusColor(theme, theme.entityColors.default)
  const indexPatientColor = theme.entityColors.indexPatient
  const backgroundColor = theme.palette.background.paper
  const brushColor = theme.entityColors.cohort

  const renderCircle = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, strokeStyle: string) => {
      ctx.beginPath()
      ctx.arc(x, y, size, 0, 2 * Math.PI)
      changeCanvasFillStyle(ctx, color)
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = strokeStyle
      ctx.stroke()
    },
    [],
  )

  const renderActiveNode = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      { xScale, yScale }: ScatterPlotLayerProps<ScatterPlotDatum>,
      node: ScatterPlotNodeData<ScatterPlotDatum>,
      activeColor: string,
    ) => {
      ctx.moveTo(xScale(node.x), yScale(node.y))
      renderCircle(ctx, node.x, node.y, (ACTIVE_NODE_SCALE_FACTOR * node.size) / 2, node.data.entityId, activeColor)
    },
    [renderCircle],
  )

  // custom layer to control rendering z-order (filtered out in the back, hovered/selected in the front etc.)
  const marksLayer: ScatterPlotCustomCanvasLayer<ScatterPlotDatum> = useCallback(
    (ctx, props) => {
      const { nodes } = props

      nodes.forEach(
        (n) => n.data.isFilteredOut && renderCircle(ctx, n.x, n.y, n.size / 2, n.data.color, backgroundColor),
      )

      nodes.forEach(
        (n) => !n.data.isFilteredOut && renderCircle(ctx, n.x, n.y, n.size / 2, n.data.color, backgroundColor),
      )

      const hoveredNode = nodes.find((n) => n.data.entityId === hoveredEntity)
      if (hoveredNode) {
        renderActiveNode(ctx, props, hoveredNode, hoveredColor)
      }

      const brushedNodes = nodes.filter((n) => cohortPatientIds.has(n.data.entityId))
      brushedNodes.forEach((n) => {
        renderActiveNode(ctx, props, n, brushColor)
      })

      const selectedNode = nodes.find((n) => n.data.entityId === selectedEntity)
      if (selectedNode) {
        renderActiveNode(ctx, props, selectedNode, selectedColor)
      }

      const indexNode = nodes.find((n) => n.data.entityId === indexPatientId)
      if (indexNode) {
        renderActiveNode(ctx, props, indexNode, indexPatientColor)
      }
    },
    [
      renderCircle,
      backgroundColor,
      hoveredEntity,
      renderActiveNode,
      hoveredColor,
      cohortPatientIds,
      brushColor,
      selectedEntity,
      selectedColor,
      indexPatientId,
      indexPatientColor,
    ],
  )

  const brushLayer: ScatterPlotCustomCanvasLayer<ScatterPlotDatum> = useCallback(
    (ctx, props) => {
      requestAnimationFrame(() => {
        if (brushing.brushMode === 'on' && mouseEvent !== 'outside-of-canvas' && mouseEvent.nativeEvent.buttons === 1) {
          const { nodes } = props
          const ids = new Set(
            nodes
              .filter((n) => {
                const x = n.x + MARGIN.left
                const y = n.y + MARGIN.top
                const [cursorX, cursorY] = getRelativeCursor(ctx.canvas, mouseEvent)
                return !n.data.isFilteredOut && Math.abs(x - cursorX) <= n.size && Math.abs(y - cursorY) <= n.size
              })
              .map((n) => n.data.entityId),
          )
          onUpdateCohort(ids)
        }
      })
    },
    [brushing.brushMode, mouseEvent, onUpdateCohort],
  )

  const onMouseMove: ScatterPlotMouseHandler<ScatterPlotDatum> = useCallback(
    (node, event) => {
      onEntityHover(node.data.isFilteredOut ? EntityIdNone : node.data.entityId)
      setMouseEvent(event)
    },
    [onEntityHover],
  )

  const onMouseLeave = useCallback(() => {
    onEntityHover(EntityIdNone)
    setMouseEvent('outside-of-canvas')
  }, [onEntityHover])

  return (
    <Paper sx={sxRoot} variant="outlined">
      <Grid sx={sxToolbar} container>
        <BrushControls />
        <Grid item>
          <FormControlLabel
            control={<Switch checked={showFilteredOut} onChange={onSetShowFilteredOut} color="primary" size="small" />}
            label="Show Filtered Patients"
          />
        </Grid>
      </Grid>
      <div>
        <AutoSizer>
          {({ width, height }: Size) => {
            return (
              <ScatterPlotCanvas
                width={width}
                height={height}
                margin={MARGIN}
                data={data}
                renderNode={noOp} // rendering points in the custom layer
                xScale={xScaleConfig}
                axisLeft={{ legend: yAxisLabel, legendPosition: 'middle', legendOffset: -50 }}
                axisBottom={{ legend: xAxisLabel, legendPosition: 'middle', legendOffset: 40 }}
                yScale={yScaleConfig}
                theme={{
                  textColor: theme.palette.text.primary,
                  axis: { legend: { text: { fontWeight: 'bold' } } },
                  grid: { line: { stroke: alpha(theme.palette.text.disabled, 0.2) } },
                }}
                layers={['grid', 'axes', 'nodes', 'mesh', 'legends', 'annotations', brushLayer, marksLayer]}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                onClick={onPlotClick}
                tooltip={(_) => null} // using info panel instead
              />
            )
          }}
        </AutoSizer>
      </div>
    </Paper>
  )
}
