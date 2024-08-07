import React, { useState } from 'react'

import { makeStyles } from '../../utils'
import { Button, Chip, CircularProgress, Stack } from '@mui/material'
import { ExpandLess, ExpandMore } from '@mui/icons-material'

import { LogMessage as LogMessageType } from '../types'
import { LogMessage } from './LogMessage'

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
  stackContainer: {
    margin: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
    borderRadius: theme.spacing(1),
  },
}))

interface StackMessageProps {
  content: string
  stack: ReadonlyArray<LogMessageType>
  isLoading: boolean
}

export const StackMessage = ({ content, stack, isLoading }: StackMessageProps) => {
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
          {content}
          <Chip label={stack.length} color={'default'} size="small" sx={{ marginLeft: 1 }} />
        </Button>
      </Stack>
      {expanded && (
        <Stack direction={'column'} gap={1} className={classes.stackContainer}>
          {stack.map((log, index) => (
            <LogMessage key={index} title={log.title} content={log.content} isLoading={false} />
          ))}
        </Stack>
      )}
    </Stack>
  )
}
