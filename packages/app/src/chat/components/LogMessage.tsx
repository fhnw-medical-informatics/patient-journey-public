import React, { useState } from 'react'

import { makeStyles } from '../../utils'
import { Button, CircularProgress, Stack } from '@mui/material'
import { ExpandLess, ExpandMore } from '@mui/icons-material'

const useStyles = makeStyles()((theme) => ({
  container: {
    color: theme.palette.text.primary,
  },
  title: {
    '& button': {
      fontSize: '0.8rem',
      fontWeight: 600,
    },
  },
}))

interface LogMessageProps {
  title: string
  content: string
  isLoading: boolean
}

export const LogMessage = ({ title, content, isLoading }: LogMessageProps) => {
  const { classes } = useStyles()
  const [expanded, setExpanded] = useState(false)

  return (
    <Stack direction={'column'} alignItems={'center'} gap={0} className={classes.container}>
      <Stack direction={'row'} alignItems={'center'} gap={1} className={classes.title}>
        {isLoading && <CircularProgress size={15} color="inherit" />}
        <Button
          onClick={() => setExpanded(!expanded)}
          variant="text"
          color="inherit"
          endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
        >
          {title}
        </Button>
      </Stack>
      {expanded && <p>{content}</p>}
    </Stack>
  )
}
