import React, { useDeferredValue } from 'react'

import { CustomLayer, CustomLayerProps, TimelineEvent } from 'react-svg-timeline'

import { useTimelineCursorPosition } from '../hooks'

import { TimelineCanvasMarksInteraction as TimelineCanvasMarksInteractionComponent } from '../components/TimelineCanvasMarksInteraction'
import { useEntityInteraction } from '../../data/hooks'

const TimelineCanvasMarksInteraction = <
  EID extends string,
  PatientId extends string,
  E extends TimelineEvent<EID, PatientId>,
>(
  props: CustomLayerProps<EID, PatientId, E>,
) => {
  const cursorPosition = useTimelineCursorPosition()

  const deferredPosition = useDeferredValue(cursorPosition)

  const { onEntityClick, onEntityHover } = useEntityInteraction('events')

  return (
    <TimelineCanvasMarksInteractionComponent
      {...props}
      cursorPosition={deferredPosition}
      onSelect={onEntityClick}
      onHover={onEntityHover}
    />
  )
}

// A passthrough component is needed to prevent the whole timeline from re-rendering
// when the container hooks change.
export const TimelineCanvasMarksInteractionLayer: CustomLayer = (props) => {
  return <TimelineCanvasMarksInteraction {...props} />
}
