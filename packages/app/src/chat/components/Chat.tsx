import React, { useCallback, useEffect, useRef, useState } from 'react'

import {
  Alert,
  Button,
  Card,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import RestartAltIcon from '@mui/icons-material/RestartAlt'

import { makeStyles } from '../../utils'

import { ChatMessage as ChatMessageType } from '../types'
import { ChatMessage } from './ChatMessage'
import { ChatTemplates } from './ChatTemplates'
import { InfoOutlined, StopCircleOutlined } from '@mui/icons-material'

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    margin: 'auto',
    gridTemplateColumns: '1fr',
    gap: theme.spacing(2),
  },
  chatContainer: {
    height: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: `0 ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(2)}`,
    gap: theme.spacing(1),
  },
  loadingBubble: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: theme.spacing(1),
    '& > span:nth-of-type(1)': {
      animation: 'loading 1s infinite',
      animationDelay: '0s',
    },
    '& > span:nth-of-type(2)': {
      animation: 'loading 1s infinite',
      animationDelay: '0.33s',
    },
    '& > span:nth-of-type(3)': {
      animation: 'loading 1s infinite',
      animationDelay: '0.66s',
    },
    '@keyframes loading': {
      '0%': {
        opacity: 0.2,
      },
      '50%': {
        opacity: 1,
      },
      '100%': {
        opacity: 0.2,
      },
    },
  },
  loadingCircle: {
    width: '1em',
    height: '1em',
    borderRadius: '50%',
    backgroundColor: theme.palette.grey[800],
  },
}))

export interface Props {
  messages: ReadonlyArray<ChatMessageType>
  onConfirmToolCalls: () => void
  onRejectToolCalls: () => void
  onSubmitMessage: (message: string) => void
  onCancelRequest: () => void
  isLoading: boolean
  hasError: boolean
  onReset: () => void
  cohortItemCount: number
}

export const Chat = ({
  messages,
  onConfirmToolCalls,
  onRejectToolCalls,
  onSubmitMessage,
  onCancelRequest,
  isLoading,
  hasError,
  onReset,
  cohortItemCount,
}: Props) => {
  const { classes } = useStyles()

  const [inputValue, setInputValue] = useState('')

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    (text: string) => {
      onSubmitMessage(text)
      setInputValue('')
    },
    [onSubmitMessage],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(inputValue)
      }
    },
    [inputValue, handleSubmit],
  )

  useEffect(scrollToBottom, [messages])

  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus()
    }
  }, [isLoading])

  return (
    <Card variant="outlined" className={classes.root}>
      {/* Chat Container */}
      <div className={classes.chatContainer}>
        {[...messages].reverse().map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            isLoading={index === messages.length - 1 && isLoading}
            onConfirmToolCalls={onConfirmToolCalls}
            onRejectToolCalls={onRejectToolCalls}
          />
        ))}
        {isLoading && !messages[0]?.isStreaming && (
          <div className={classes.loadingBubble}>
            <span className={classes.loadingCircle} />
            <span className={classes.loadingCircle} />
            <span className={classes.loadingCircle} />
          </div>
        )}
        {hasError && (
          <Typography variant="body1" color="error">
            An error occurred while processing your request. Try again later.
          </Typography>
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input Container */}
      <div className={classes.inputContainer}>
        <Stack direction="column" gap={1}>
          <Stack direction="row" justifyContent="space-between" alignItems={'center'}>
            {cohortItemCount >= 4 ? (
              <Alert severity="warning">
                <Stack direction="row" alignItems={'center'} gap={1}>
                  Consider the cost implications of a {cohortItemCount}-member cohort.
                  <Tooltip
                    title={`Utilizing the cohort context in your prompt will append the associated patient journeys. Given that each journey averages around 4000 tokens, the cost could be as high as $${(
                      0.00001 *
                      4000 *
                      cohortItemCount
                    ).toFixed(2)} per prompt with GPT-4 Turbo.`}
                    placement="top"
                  >
                    <InfoOutlined />
                  </Tooltip>
                </Stack>
              </Alert>
            ) : (
              <div />
            )}
            <Button variant="text" onClick={onReset} disabled={isLoading} endIcon={<RestartAltIcon />}>
              Reset
            </Button>
          </Stack>
          <OutlinedInput
            inputProps={{
              ref: inputRef,
            }}
            id="filled-textarea"
            placeholder="Enter a prompt…"
            multiline
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            endAdornment={
              !isLoading ? (
                <InputAdornment position="end">
                  <IconButton onClick={() => handleSubmit(inputValue)}>
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ) : (
                <InputAdornment position="end">
                  <IconButton onClick={onCancelRequest}>
                    <StopCircleOutlined />
                  </IconButton>
                </InputAdornment>
              )
            }
            autoFocus
          />
          <Stack direction="column" gap={2}>
            <Typography variant="caption" color="text.disabled">
              <strong>Pro tip:</strong> You can refer to the selected patient or patients in the cohort.
            </Typography>
            <ChatTemplates onTemplateClick={setInputValue} disabled={isLoading} />
          </Stack>
        </Stack>
      </div>
    </Card>
  )
}
