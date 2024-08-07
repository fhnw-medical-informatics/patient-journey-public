import React, { useCallback } from 'react'

import { useChat } from '../hooks'

import { useAppDispatch } from '../../store'

import { addPrompt, cancelRequest, confirmToolCalls, rejectToolCalls, reset } from '../chatSlice'

import { Chat as ChatComponent } from '../components/Chat'
import { usePatientCohort } from '../../data/hooks'

export const Chat = () => {
  const chatState = useChat()
  const cohort = usePatientCohort()

  const dispatch = useAppDispatch()

  const handleConfirmToolCalls = useCallback(() => {
    dispatch(confirmToolCalls())
  }, [dispatch])

  const handleRejectToolCalls = useCallback(() => {
    dispatch(rejectToolCalls())
  }, [dispatch])

  const handleSubmitMessage = useCallback(
    (message: string) => {
      dispatch(
        addPrompt({
          prompt: message,
        }),
      )
    },
    [dispatch],
  )

  const handleCancelRequest = useCallback(() => {
    dispatch(cancelRequest())
  }, [dispatch])

  const handleReset = useCallback(() => {
    dispatch(reset())
  }, [dispatch])

  return (
    <ChatComponent
      messages={[...chatState.messages].filter((m) => m.role !== 'tool').reverse()}
      onConfirmToolCalls={handleConfirmToolCalls}
      onRejectToolCalls={handleRejectToolCalls}
      onSubmitMessage={handleSubmitMessage}
      onCancelRequest={handleCancelRequest}
      isLoading={chatState.loadingState === 'loading-in-progress'}
      hasError={chatState.loadingState === 'loading-failed'}
      onReset={handleReset}
      cohortItemCount={cohort.size}
    />
  )
}
