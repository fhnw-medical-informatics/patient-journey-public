import { BackendChatMessage, ChatMessage } from './types'

export const prepareBackendChatMessages = (messages: ReadonlyArray<ChatMessage>): ReadonlyArray<BackendChatMessage> => {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant' || message.role === 'tool')
    .map((message) => {
      if (message.role === 'user') {
        return {
          role: 'user',
          content: message.content,
        }
      } else if (message.role === 'assistant') {
        return {
          role: 'assistant',
          content: message.content,
          tool_calls: message.tool_calls,
        }
      } else if (message.role === 'tool') {
        return {
          role: 'tool',
          content: message.content,
          tool_call_id: message.tool_call_id,
        }
      } else {
        throw new Error(`Invalid backend message role: ${message.role}`)
      }
    }) as BackendChatMessage[]
}
