import { ToolCall } from '@langchain/core/messages'

type UserMessage = {
  role: 'user'
  content: string
}

type AssistantMessage = {
  role: 'assistant'
  content: string
  tool_calls?: ReadonlyArray<ToolCall>
}

type AssistantMessageWithToolChoice = AssistantMessage & {
  tool_choice?: 'confirmed' | 'rejected' | 'none'
}

export type ToolMessage = {
  role: 'tool'
  content: string
  tool_call_id: string
}

type ContextMessage = {
  role: 'context'
  title: string
  content: string
}

export type LogMessage = {
  role: 'log'
  title: string
  content: string
}

export type StackMessage = {
  role: 'stack'
  content: string
  stack: LogMessage[]
}

type BaseMessage = {
  readonly isStreaming: boolean
  readonly isCancelled: boolean
  readonly showTruncationError?: boolean
}

export type ChatMessage = (
  | UserMessage
  | AssistantMessageWithToolChoice
  | ToolMessage
  | ContextMessage
  | LogMessage
  | StackMessage
) &
  BaseMessage

export type BackendChatMessage = UserMessage | AssistantMessage | ToolMessage
