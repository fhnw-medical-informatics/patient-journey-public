import type { StoryDecorator } from '@ladle/react'
import { CommonStoryDecorator } from './CommonStoryDecorator'
import { Chat, Props } from '../chat/components/Chat'
import { ChatMessage as ChatMessageType } from '../chat/types'

export default {
  decorators: [
    CommonStoryDecorator,
    (Component) => {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
          <Component />
        </div>
      )
    },
  ] as StoryDecorator[],
}

const defaultProps: Omit<Props, 'messages'> = {
  onConfirmToolCalls: () => {},
  onRejectToolCalls: () => {},
  onSubmitMessage: (message: string) => console.log(message),
  onCancelRequest: () => console.log('Cancel Request'),
  isLoading: false,
  hasError: false,
  onReset: () => {},
  cohortItemCount: 0,
}

const MESSAGES: ReadonlyArray<ChatMessageType> = [
  {
    role: 'user',
    content: 'Hello, how can I assist you with patient data today?',
  } as ChatMessageType,
  {
    role: 'assistant',
    content: 'I need information on patient 12345.',
    isStreaming: false,
  } as ChatMessageType,
  {
    role: 'user',
    content: 'Let me look that up for you.',
  } as ChatMessageType,
  {
    role: 'log',
    title: 'Fetching Data',
    content: 'Initiated data fetch for patient 12345.',
  } as ChatMessageType,
  {
    role: 'assistant',
    content: '',
    tool_calls: [
      {
        id: 'tool_call_1',
        function: {
          arguments: '{"patientId":"12345"}',
          name: 'get_patient_data',
        },
        type: 'function',
      },
    ],
    tool_choice: 'confirmed',
    isStreaming: false,
    isCancelled: false,
  } as ChatMessageType,
  {
    role: 'user',
    content: 'Thank you, please proceed.',
  } as ChatMessageType,
  {
    role: 'stack',
    content: 'Using Tools',
    stack: [
      {
        role: 'log',
        title: 'Data Retrieved',
        content: 'Patient data for 12345 has been successfully retrieved.',
      } as ChatMessageType,
      {
        role: 'log',
        title: 'Data Retrieved',
        content: 'Patient data for 12345 has been successfully retrieved.',
      } as ChatMessageType,
    ],
    isStreaming: false,
    isCancelled: false,
  } as ChatMessageType,
  {
    role: 'assistant',
    content: 'Here is the information for patient 12345.',
    isStreaming: false,
  } as ChatMessageType,
].reverse()

export const Default = () => <Chat {...defaultProps} messages={MESSAGES} />

export const Loading = () => <Chat {...defaultProps} messages={MESSAGES} isLoading={true} />

export const CohortCountWarning = () => <Chat {...defaultProps} messages={MESSAGES} cohortItemCount={4} />
