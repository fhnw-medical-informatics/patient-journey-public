import {
  Box,
  FormControlLabel,
  FormGroup,
  Switch,
  SxProps,
  Theme,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { BRUSH_MODE_SEMANTICS_ADD, BRUSH_MODE_SEMANTICS_SUBTRACT, Brushing, BrushMode, BrushSemantics } from '../model'
import React from 'react'
import BrushIcon from '@mui/icons-material/FormatPaint'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'

const sxRoot: SxProps = {
  display: 'grid',
  alignItems: 'center',
  gridTemplateColumns: 'auto auto',
  gap: 2,
}

const sxIconFn = (isBrushingDisabled: boolean) => ({
  color: (theme: Theme) => theme.entityColors.cohort,
  opacity: isBrushingDisabled ? 0.2 : 1,
})

const sxIconOverlay: SxProps = {
  position: 'absolute',
  right: '-2px',
  bottom: '-2px',
  transform: 'scale(0.7)',
}

interface Props {
  readonly brushing: Brushing
  readonly onBrushModeChange: (mode: BrushMode) => void
  readonly onBrushSemanticsChange: (semantics: BrushSemantics) => void
}

export const BrushControls = ({ brushing, onBrushModeChange, onBrushSemanticsChange }: Props) => {
  const handleModeSwitch = (_: React.ChangeEvent, checked: boolean) => {
    onBrushModeChange(checked ? 'on' : 'off')
  }

  const handleSemanticsChange = (_: React.MouseEvent<HTMLElement>, value: BrushSemantics) => {
    // enforce radio semantics
    if (value !== null) {
      onBrushSemanticsChange(value)
    }
  }

  const isBrushingDisabled = brushing.brushMode === 'off'
  const sxIcon = sxIconFn(isBrushingDisabled)

  return (
    <Box sx={sxRoot}>
      <FormGroup>
        <FormControlLabel
          control={<Switch checked={brushing.brushMode === 'on'} onChange={handleModeSwitch} />}
          label={'Cohort Brushing'}
        />
      </FormGroup>
      <ToggleButtonGroup
        value={brushing.brushSemantics}
        exclusive
        onChange={handleSemanticsChange}
        aria-label="text alignment"
      >
        <ToggleButton value={BRUSH_MODE_SEMANTICS_ADD} disabled={isBrushingDisabled}>
          <BrushIcon sx={sxIcon} />
          <AddIcon sx={[sxIcon, sxIconOverlay]} />
        </ToggleButton>
        <ToggleButton value={BRUSH_MODE_SEMANTICS_SUBTRACT} disabled={isBrushingDisabled}>
          <BrushIcon sx={sxIcon} />
          <RemoveIcon sx={[sxIcon, sxIconOverlay]} />
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}
