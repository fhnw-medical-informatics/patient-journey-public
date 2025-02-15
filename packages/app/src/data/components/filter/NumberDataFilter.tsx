import React, { useCallback } from 'react'

import { FormGroup, TextField, Grid } from '@mui/material'
import { createFilter, Filter } from '../../filtering'
import { makeStyles } from '../../../utils'
import { DataColumn } from '../../columns'
import { Entity } from '../../entities'
import { useNumbers } from '../diagram/hooks'
import { CustomSliderThumb } from './slider/CustomSliderThumb'
import { CustomSlider } from './slider/CustomSlider'
import { ColorLegendGradient } from '../../../color/containers/ColorLegendGradient'

const useStyles = makeStyles()(() => ({
  input: {
    width: '100%',
    maxWidth: '80px',
  },
}))

export interface NumberDataFilterProps extends Filter<'number'> {
  allActiveData: ReadonlyArray<Entity>
  onChange: (filter: Filter<'number'>) => void
  onRemove: (filter: Filter<'number'>) => void
}

export const NumberDataFilter = ({ allActiveData, column, type, value, onChange, onRemove }: NumberDataFilterProps) => {
  const { classes } = useStyles()

  const { niceMin, niceMax, niceStep } = useNumbers(allActiveData, column as DataColumn<'number'>)

  const handleChange = useCallback(
    (fromValue: number | null, toValue: number | null) => {
      const _toValue = toValue !== null ? toValue : value.to

      const filter = createFilter(column, type, {
        from: fromValue !== null ? fromValue : value.from,
        to: _toValue,
        toInclusive: _toValue === niceMax,
      })

      if (isNaN(filter.value.from) && isNaN(filter.value.to)) {
        onRemove(filter)
      } else {
        onChange(filter)
      }
    },
    [column, niceMax, onChange, onRemove, type, value],
  )

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      handleChange(newValue[0], newValue[1])
    }
  }

  const numberProps = {
    min: niceMin,
    max: niceMax,
    step: niceStep,
  }

  const isDisabled = niceMin === niceMax

  return (
    <FormGroup>
      <CustomSlider
        value={[!isNaN(value.from) ? value.from : niceMin, !isNaN(value.to) ? value.to : niceMax]}
        onChange={handleSliderChange}
        valueLabelDisplay="auto"
        size="small"
        components={{
          Thumb: CustomSliderThumb,
        }}
        {...numberProps}
        disabled={isDisabled}
      />
      <ColorLegendGradient column={column} min={niceMin} max={niceMax} />
      <Grid container spacing={1} direction="row">
        <Grid item xs={6}>
          <Grid container justifyContent="flex-start">
            <Grid item className={classes.input}>
              <TextField
                label={'From'}
                variant="filled"
                size="small"
                type={'number'}
                value={!isNaN(value.from) ? value.from : ''}
                onChange={(event) => {
                  handleChange(event.target.value ? +event.target.value : NaN, null)
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={numberProps}
                disabled={isDisabled}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={6}>
          <Grid container justifyContent="flex-end">
            <Grid item className={classes.input}>
              <TextField
                label={'To'}
                variant="filled"
                size="small"
                type={'number'}
                value={!isNaN(value.to) ? value.to : ''}
                onChange={(event) => {
                  handleChange(null, event.target.value ? +event.target.value : NaN)
                }}
                InputLabelProps={{ shrink: true }}
                inputProps={numberProps}
                disabled={isDisabled}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </FormGroup>
  )
}
