import { MuiMarkdown } from 'mui-markdown'
import { makeStyles } from '../../utils'
import { Button, Card, CardActions, CardContent, Theme, Tooltip, Typography, alpha } from '@mui/material'
import { ChatMessage as ChatMessageType } from '../types'
import ErrorIcon from '@mui/icons-material/Error'
import QuickreplyIcon from '@mui/icons-material/Quickreply'
import { blue } from '@mui/material/colors'
import { LogMessage } from './LogMessage'
import { StackMessage } from './StackMessage'

const messageStyles = (theme: Theme) => ({
  maxWidth: '90%',
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  margin: 0,
  '& h1': {
    fontSize: '2rem',
    fontWeight: 600,
    marginBottom: theme.spacing(2),
  },
  '& h2': {
    fontSize: '1.5rem',
    fontWeight: 600,
    marginBottom: theme.spacing(2),
  },
  '& h3': {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: theme.spacing(2),
  },
  '& p': {
    marginBottom: theme.spacing(1),
  },
  // Strong should be highlighted with a marker color
  '& strong': {
    padding: theme.spacing(0.3),
    fontWeight: 600,
    backgroundColor: alpha(theme.palette.secondary.main, 0.2),
    borderRadius: theme.spacing(0.7),
    color: theme.palette.secondary.main,
  },
})

const useStyles = makeStyles()((theme) => ({
  chatMessageLeft: {
    position: 'relative',
    ...messageStyles(theme),
    alignSelf: 'flex-start',
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
  },
  chatMessageCenter: {
    ...messageStyles(theme),
    width: 'auto',
    alignSelf: 'center',
  },
  chatMessageRight: {
    ...messageStyles(theme),
    alignSelf: 'flex-end',
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.info.main : blue[100],
  },
  chatMessageText: {
    margin: 0,
    padding: 0,
    '& > div': {
      display: 'grid',
    },
    color: theme.palette.text.primary,
  },
  errorIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    marginTop: -10,
    marginRight: -10,
  },
  list: {
    padding: 0,
    margin: 0,
    listStyle: 'none',
    '& li': {
      paddingLeft: theme.spacing(2),
      position: 'relative',
      '&:before': {
        content: '"– "',
        position: 'absolute',
        left: 0,
      },
    },
  },
  listItem: {
    padding: 0,
    margin: 0,
  },
}))

export interface Props {
  message: ChatMessageType
  isLoading: boolean
  onConfirmToolCalls: () => void
  onRejectToolCalls: () => void
}

export const ChatMessage = ({ message, isLoading, onConfirmToolCalls, onRejectToolCalls }: Props) => {
  const { classes } = useStyles()

  return (
    <>
      {message.role === 'stack' ? (
        <div className={classes.chatMessageCenter}>
          <StackMessage content={message.content} stack={message.stack} isLoading={isLoading} />
        </div>
      ) : message.role === 'log' ? (
        <div className={classes.chatMessageCenter}>
          <LogMessage title={message.title} content={message.content} isLoading={isLoading} />
        </div>
      ) : message.role === 'context' ? (
        <div className={classes.chatMessageCenter}>
          <p className={classes.chatMessageText}>
            Context: {message.title} - {message.content}
          </p>
        </div>
      ) : (
        <div className={message.role === 'user' ? classes.chatMessageRight : classes.chatMessageLeft}>
          {message.showTruncationError ? (
            <Tooltip title={'Truncated (max number of tokens reached)'}>
              <ErrorIcon className={classes.errorIcon} color="warning" />
            </Tooltip>
          ) : (
            message.isCancelled && (
              <Tooltip title={'Request cancelled by user'}>
                <QuickreplyIcon className={classes.errorIcon} />
              </Tooltip>
            )
          )}
          <div className={classes.chatMessageText}>
            <MuiMarkdown>{`${message.content.replace(/\n/g, '\n\n')}${message.isStreaming ? ' ⬤' : ''}`}</MuiMarkdown>
          </div>
          {message.role === 'assistant' && message.tool_calls && message.tool_calls.length > 0 && (
            <Card variant="elevation" elevation={0} sx={{ backgroundColor: 'transparent' }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary" gutterBottom>
                  Tool Calls ({message.tool_calls.length})
                </Typography>
                <Typography variant="body1">
                  <b>The Assistant wants to:</b>
                </Typography>
                <ul className={classes.list}>
                  {message.tool_calls.map((toolCall, index) => (
                    <Typography key={index} variant="body2" component={'li'} className={classes.listItem}>
                      {(() => {
                        switch (toolCall.function.name) {
                          // Define specific labels for known function names
                          case 'client_tool_highlight_patient_journeys':
                            return 'Highlight patient journeys by adding them to the cohort.'
                          default:
                            return toolCall.function.name
                        }
                      })()}
                    </Typography>
                  ))}
                </ul>
              </CardContent>
              <CardActions>
                {message.tool_choice === 'none' ? (
                  <>
                    <Button variant="outlined" onClick={onConfirmToolCalls} size="small">
                      Confirm
                    </Button>
                    <Button onClick={onRejectToolCalls} size="small">
                      Reject
                    </Button>
                  </>
                ) : (
                  <Typography
                    variant="body1"
                    color={message.tool_choice === 'confirmed' ? 'primary' : 'error'}
                    sx={{ marginLeft: 1 }}
                  >
                    {message.tool_choice === 'confirmed' ? 'Confirmed' : 'Rejected'}
                  </Typography>
                )}
              </CardActions>
            </Card>
          )}
        </div>
      )}
    </>
  )
}
