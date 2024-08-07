import { ChatMessage, Props } from '../chat/components/ChatMessage'
import type { StoryDecorator } from '@ladle/react'
import { CommonStoryDecorator } from './CommonStoryDecorator'
import { ChatMessage as ChatMessageType } from '../chat/types'

const USER_MESSAGE: ChatMessageType = {
  role: 'user',
  content: 'This is a user message.',
  isStreaming: false,
  isCancelled: false,
}

const USER_MESSAGE_SHORT: ChatMessageType = {
  role: 'user',
  content: 'hi',
  isStreaming: false,
  isCancelled: false,
}

const ASSISTANT_MESSAGE: ChatMessageType = {
  role: 'assistant',
  content: 'This is an assistant message.',
  isStreaming: false,
  isCancelled: false,
}

const CONTEXT_MESSAGE: ChatMessageType = {
  role: 'context',
  title: 'Context Information',
  content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
  isStreaming: false,
  isCancelled: false,
}

const LOG_MESSAGE: ChatMessageType = {
  role: 'log',
  title: 'Tool Call (Agent)',
  content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
  isStreaming: false,
  isCancelled: false,
}

const ASSISTANT_MESSAGE_STREAMING: ChatMessageType = {
  role: 'assistant',
  content: 'This is an assistant message. It is streaming.',
  isStreaming: true,
  isCancelled: false,
}

const ASSISTANT_MESSAGE_CANCELLED: ChatMessageType = {
  role: 'assistant',
  content: 'This is an assistant message. It has been can',
  isStreaming: false,
  isCancelled: true,
}

const ASSISTANT_MESSAGE_TOOL_CALL: ChatMessageType = {
  role: 'assistant',
  content: '',
  tool_calls: [
    {
      id: 'call_ZS13ADv1xJxtidBPdLzXFqVw',
      function: {
        arguments: '{"pids":["005"]}',
        name: 'client_tool_highlight_patient_journeys',
      },
      type: 'function',
    },
  ],
  tool_choice: 'none',
  isStreaming: false,
  isCancelled: false,
}

const ASSISTANT_MESSAGE_TOOL_CALL_CONFIRMED: ChatMessageType = {
  role: 'assistant',
  content: '',
  tool_calls: [
    {
      id: 'call_ZS13ADv1xJxtidBPdLzXFqVw',
      function: {
        arguments: '{"pids":["005"]}',
        name: 'client_tool_highlight_patient_journeys',
      },
      type: 'function',
    },
  ],
  tool_choice: 'confirmed',
  isStreaming: false,
  isCancelled: false,
}

const ASSISTANT_MESSAGE_TOOL_CALL_REJECTED: ChatMessageType = {
  role: 'assistant',
  content: '',
  tool_calls: [
    {
      id: 'call_ZS13ADv1xJxtidBPdLzXFqVw',
      function: {
        arguments: '{"pids":["005"]}',
        name: 'client_tool_highlight_patient_journeys',
      },
      type: 'function',
    },
  ],
  tool_choice: 'rejected',
  isStreaming: false,
  isCancelled: false,
}

const STACK_MESSAGE_ONE: ChatMessageType = {
  role: 'stack',
  content: 'Using Tools',
  stack: [
    {
      role: 'log',
      title: 'Tool Call (Agent)',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
    },
  ],
  isStreaming: false,
  isCancelled: false,
}

const STACK_MESSAGE_MANY: ChatMessageType = {
  role: 'stack',
  content: 'Using Tools',
  stack: [
    {
      role: 'log',
      title: 'Tool Call (Agent)',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
    },
    {
      role: 'log',
      title: 'Tool Call Response',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ',
    },
  ],
  isStreaming: false,
  isCancelled: false,
}

const ASSISTANT_MESSAGE_TOOL_CALLS: ChatMessageType = {
  role: 'assistant',
  content: '',
  tool_calls: [
    {
      id: 'call_ZS13ADv1xJxtidBPdLzXFqVw',
      function: {
        arguments: '{"pids":["005"]}',
        name: 'client_tool_highlight_patient_journeys',
      },
      type: 'function',
    },
    {
      id: 'call_ZS13ADv1xJxtidBPdLzXFqVw',
      function: {
        arguments: '{"test":"test"}',
        name: 'client_tool_test',
      },
      type: 'function',
    },
  ],
  tool_choice: 'none',
  isStreaming: false,
  isCancelled: false,
}

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

const defaultProps: Omit<Props, 'message'> = {
  isLoading: true,
  onConfirmToolCalls: () => {},
  onRejectToolCalls: () => {},
}

export const UserMessage = () => <ChatMessage {...defaultProps} message={USER_MESSAGE} />

export const UserShortMessage = () => <ChatMessage {...defaultProps} message={USER_MESSAGE_SHORT} />

export const AssistantMessage = () => <ChatMessage {...defaultProps} message={ASSISTANT_MESSAGE} />

export const ContextMessage = () => <ChatMessage {...defaultProps} message={CONTEXT_MESSAGE} />

export const TruncatedMessage = () => (
  <ChatMessage {...defaultProps} message={{ ...ASSISTANT_MESSAGE, showTruncationError: true }} />
)

export const StreamingMessage = () => <ChatMessage {...defaultProps} message={ASSISTANT_MESSAGE_STREAMING} />

export const CancelledMessage = () => <ChatMessage {...defaultProps} message={ASSISTANT_MESSAGE_CANCELLED} />

export const ToolCallMessage = () => <ChatMessage {...defaultProps} message={ASSISTANT_MESSAGE_TOOL_CALL} />

export const ToolCallConfirmedMessage = () => (
  <ChatMessage {...defaultProps} message={ASSISTANT_MESSAGE_TOOL_CALL_CONFIRMED} />
)

export const ToolCallRejectedMessage = () => (
  <ChatMessage {...defaultProps} message={ASSISTANT_MESSAGE_TOOL_CALL_REJECTED} />
)

export const ToolCallsMessage = () => <ChatMessage {...defaultProps} message={ASSISTANT_MESSAGE_TOOL_CALLS} />

export const LogMessage = () => <ChatMessage {...defaultProps} message={LOG_MESSAGE} />

export const StackMessageOne = () => <ChatMessage {...defaultProps} message={STACK_MESSAGE_ONE} />

export const StackMessageMany = () => <ChatMessage {...defaultProps} message={STACK_MESSAGE_MANY} />
