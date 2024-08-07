import { BrushControls as BrushControlsComponent } from '../components/BrushControls'
import { useScatterPlotBrushing } from '../hooks'
import { useCallback } from 'react'
import { useAppDispatch } from '../../store'
import { setBrushMode, setBrushSemantics } from '../plotSlice'
import { BrushMode, BrushSemantics } from '../model'

export const BrushControls = () => {
  const brushing = useScatterPlotBrushing()
  const dispatch = useAppDispatch()

  const onBrushModeChange = useCallback(
    (mode: BrushMode) => {
      dispatch(setBrushMode(mode))
    },
    [dispatch],
  )

  const onBrushSemanticsChange = useCallback(
    (semantics: BrushSemantics) => {
      dispatch(setBrushSemantics(semantics))
    },
    [dispatch],
  )

  return (
    <BrushControlsComponent
      brushing={brushing}
      onBrushModeChange={onBrushModeChange}
      onBrushSemanticsChange={onBrushSemanticsChange}
    />
  )
}
