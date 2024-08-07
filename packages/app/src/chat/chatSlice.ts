import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { GetThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk'

import { RemoteRunnable } from '@langchain/core/runnables/remote'
import { ToolCall } from '@langchain/core/messages'

import { addAlerts } from '../alert/alertSlice'
import { DataState, addToCohort, clearCohort } from '../data/dataSlice'
import { PatientId } from '../data/patients'
import { ChatMessage, ToolMessage, StackMessage } from './types'
import { prepareBackendChatMessages } from './utils'
import { RootState } from '../store'

interface ChatPrompt {
  readonly prompt: string
}

interface ChatState {
  readonly loadingState: 'idle' | 'loading-in-progress' | 'loading-failed' | 'cancelled-by-user'
  readonly messages: ReadonlyArray<ChatMessage>
}

const initialState: ChatState = {
  loadingState: 'idle',
  messages: [],
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload
    },
    cancelRequest: (state) => {
      if (state.loadingState === 'loading-in-progress') {
        state.loadingState = 'cancelled-by-user'
      }
    },
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(addPrompt.pending, (state) => {
      state.loadingState = 'loading-in-progress'
    })
    builder.addCase(addPrompt.fulfilled, (state, action) => {
      state.loadingState = 'idle'
    })
    builder.addCase(addPrompt.rejected, (state) => {
      state.loadingState = 'loading-failed'
    })
    builder.addCase(confirmToolCalls.pending, (state) => {
      state.loadingState = 'loading-in-progress'
    })
    builder.addCase(confirmToolCalls.fulfilled, (state) => {
      state.loadingState = 'idle'
    })
    builder.addCase(confirmToolCalls.rejected, (state) => {
      state.loadingState = 'loading-failed'
    })
    builder.addCase(rejectToolCalls.pending, (state) => {
      state.loadingState = 'loading-in-progress'
    })
    builder.addCase(rejectToolCalls.fulfilled, (state) => {
      state.loadingState = 'idle'
    })
    builder.addCase(rejectToolCalls.rejected, (state) => {
      state.loadingState = 'loading-failed'
    })
  },
})

export const chatReducer = chatSlice.reducer

export const { reset, cancelRequest } = chatSlice.actions
const { setMessages } = chatSlice.actions

// Fetch the response from the AI for a user's prompt
export const addPrompt = createAsyncThunk('chat/addPrompt', async (prompt: ChatPrompt, thunkAPI) => {
  const chat = (thunkAPI.getState() as any).chat as ChatState

  const defaultMessage = {
    isStreaming: false,
    isCancelled: false,
  }

  // Add the user's prompt to the chat history
  const messages: Array<ChatMessage> = [...chat.messages]

  messages.push({
    role: 'user',
    content: `${prompt.prompt}`,
    ...defaultMessage,
  })

  thunkAPI.dispatch(setMessages(messages))

  // Call the API
  return await fetchResponseFromAI(messages, thunkAPI)
})

export const confirmToolCalls = createAsyncThunk('chat/confirmToolCalls', async (_, thunkAPI) => {
  const chat = (thunkAPI.getState() as any).chat as ChatState
  const messages = [...chat.messages]
  const lastMessage = messages[messages.length - 1]

  if (lastMessage.role === 'assistant' && lastMessage.tool_calls) {
    const toolCalls = lastMessage.tool_calls

    const toolMessages: Array<ToolMessage> = []

    for (const toolCall of toolCalls) {
      try {
        switch (toolCall.function.name) {
          case 'client_tool_highlight_patient_journeys': {
            console.log('client_tool_highlight_patient_journeys', toolCall)
            const params = JSON.parse(toolCall.function.arguments)

            if (!params || !Array.isArray(params.pids)) {
              throw new Error('Invalid parameters for client_tool_highlight_patient_journeys')
            }

            const pids = new Set(params.pids) as ReadonlySet<PatientId>

            thunkAPI.dispatch(clearCohort())
            thunkAPI.dispatch(addToCohort(pids))

            toolMessages.push({
              role: 'tool',
              content:
                'Highlighted the patient journeys in the app by adding them to the cohort. Patients in the cohort are colored within the scatter plot.',
              tool_call_id: toolCall.id,
            })

            break
          }
          default:
            throw new Error(`Unknown tool call: ${toolCall.function.name}`)
        }
      } catch (e) {
        console.error(`Executing tool call "${toolCall.function.name}" failed.`, e, toolCall)
        thunkAPI.dispatch(
          addAlerts([
            {
              type: 'error',
              topic: 'Chat',
              message: `Executing tool call "${toolCall.function.name}" failed. ${e}`,
            },
          ]),
        )
      }
    }

    // Confirm the tool calls
    messages.pop()
    messages.push({ ...lastMessage, tool_choice: 'confirmed' })

    // Add the tool messages to the chat history
    messages.push(...toolMessages.map((m) => ({ ...m, isStreaming: false, isCancelled: false })))

    thunkAPI.dispatch(setMessages(messages))

    // notify the api that we've invoked the function (this will lead to a proper assistant message in our history)
    return await fetchResponseFromAI(messages, thunkAPI)
  }
})

export const rejectToolCalls = createAsyncThunk('chat/rejectToolCalls', async (_, thunkAPI) => {
  const chat = (thunkAPI.getState() as any).chat as ChatState
  const messages = [...chat.messages]
  const lastMessage = messages[messages.length - 1]

  if (lastMessage.role === 'assistant' && lastMessage.tool_calls) {
    const toolCalls = lastMessage.tool_calls

    const toolMessages: Array<ToolMessage> = []

    for (const toolCall of toolCalls) {
      toolMessages.push({
        role: 'tool',
        content: 'The user rejected the execution of the tool call.',
        tool_call_id: toolCall.id,
      })
    }

    // Confirm the tool calls
    messages.pop()
    messages.push({ ...lastMessage, tool_choice: 'rejected' })

    // Add the tool messages to the chat history
    messages.push(...toolMessages.map((m) => ({ ...m, isStreaming: false, isCancelled: false })))

    thunkAPI.dispatch(setMessages(messages))

    // notify the api that we've invoked the function (this will lead to a proper assistant message in our history)
    return await fetchResponseFromAI(messages, thunkAPI)
  }
})

const getRequestContext = (thunkAPI: GetThunkAPI<any>) => {
  const data = (thunkAPI.getState() as any).data as DataState

  let cohortPIDs: PatientId[] = []
  let selectedPID: PatientId = '' as PatientId

  if (data.type === 'loading-complete') {
    cohortPIDs = [...data.cohortPatientIds]
    selectedPID = data.selected.type === 'patients' ? data.selected.uid : ('' as PatientId)
  }

  return { cohortPIDs, selectedPID }
}

const remoteChain = new RemoteRunnable({
  url: `${import.meta.env.VITE_LANGSERVE_URL}${import.meta.env.VITE_LANGSERVE_RAG_ENDPOINT}`,
  options: {
    timeout: 1000 * 60 * 5, // 5 minutes
  },
})

const fetchResponseFromAI = async (messages: ReadonlyArray<ChatMessage>, thunkAPI: GetThunkAPI<any>) => {
  const context = getRequestContext(thunkAPI)

  try {
    // Filter out client-only messages and additional properties
    const backendChatMessages = prepareBackendChatMessages(messages)

    console.log('Backend Messages:', backendChatMessages)

    // Use streamLog until streamEvents is implemented for RemoteRunnable
    // -> https://github.com/langchain-ai/langchainjs/discussions/4777
    const eventStream = await remoteChain.streamLog({
      conversation: backendChatMessages,
      selected_patient: context.selectedPID,
      cohort: context.cohortPIDs,
    })

    let finalResponse = ''
    let logMessages: StackMessage = {
      role: 'stack',
      content: 'Using Agent Tools',
      stack: [],
    }
    let toolCalls: ToolCall[] | undefined = undefined

    const chatModelLogRegex = /^\/logs\/ChatModel(?::\d+)?\/streamed_output_str\/-$/
    const toolCallsInitiateLogRegex = /^\/logs\/handle_client_tool_calls(?::\d+)?\/streamed_output\/-$/
    const getSpecificPatientJourneysToolOutputRegex = /^\/logs\/get-specific-patient-journeys(?::\d+)?\/final_output$/
    const findRelevantPatientJourneysToolOutputRegex = /^\/logs\/find-relevant-patient-journeys(?::\d+)?\/final_output$/
    const findSimilarPatientJourneysToolOutputRegex = /^\/logs\/find-similar-patient-journeys(?::\d+)?\/final_output$/
    const findPatientJourneysByStructuredQueryToolOutputRegex =
      /^\/logs\/find-patient-journeys-by-structured-query(?::\d+)?\/final_output$/

    for await (const event of eventStream) {
      // Check if user has cancelled the request
      if ((thunkAPI.getState() as RootState).chat.loadingState === 'cancelled-by-user') {
        console.log('Request cancelled by user')
        break
      }

      for (const op of event.ops) {
        // console.log(`${op.op}: ${op.path} -> ${op.value}`, op.value)

        // Interesting logs
        // ChatModel:
        // add: /logs/ChatModel/streamed_output_str/- ->  the  the
        // Tool Calls (Client):
        // add: /logs/handle_client_tool_calls/streamed_output/- -> { returnValues: { tool_calls } }
        // Tool Calls (Server):
        // add: /logs/handle_client_tool_calls/streamed_output/- -> [{ tool: 'get-specific-patient-journeys', log: '<Invoke-string>' }] array
        // Tool Calls (Server Output):
        // add: /logs/get-specific-patient-journeys/final_output -> { output: <JSON-Serialized-Object> }
        // same for all other tools probably:
        //      - find-relevant-patient-journeys
        //      - get-specific-patient-journeys
        //      - find-similar-patient-journeys
        //      - find-patient-journeys-by-structured-query
        // add: /final_output/output -> value = string

        // @ts-ignore
        if (op.op === 'add') {
          if (chatModelLogRegex.test(op.path)) {
            finalResponse += op.value

            const finalResponseMessage: ChatMessage = {
              role: 'assistant',
              content: finalResponse ?? '',
              tool_calls: [],
              tool_choice: 'none',
              isStreaming: true,
              isCancelled: false,
            }

            if (finalResponse) {
              thunkAPI.dispatch(
                setMessages([
                  ...messages,
                  ...(logMessages.stack.length > 0 ? [logMessages, finalResponseMessage] : [finalResponseMessage]),
                ]),
              )
            }

            console.log('ChatModel:', op.value)
          } else if (toolCallsInitiateLogRegex.test(op.path)) {
            if (op.value['returnValues'] && op.value['returnValues']['tool_calls']) {
              console.log('Tool Calls (Client):', op.value['returnValues']['tool_calls'])
              toolCalls = op.value['returnValues']['tool_calls']
            } else if (Array.isArray(op.value) && op.value[0] && op.value[0]['log']) {
              logMessages = {
                ...logMessages,
                stack: [
                  ...logMessages.stack,
                  {
                    role: 'log',
                    title: 'Invoking Tool',
                    content: op.value[0]['log'],
                  },
                ],
              }

              thunkAPI.dispatch(setMessages([...messages, logMessages]))

              console.log('Tool Calls (Agent):', op.value[0]['log'])
            }
          } else if (
            getSpecificPatientJourneysToolOutputRegex.test(op.path) ||
            findRelevantPatientJourneysToolOutputRegex.test(op.path) ||
            findSimilarPatientJourneysToolOutputRegex.test(op.path) ||
            findPatientJourneysByStructuredQueryToolOutputRegex.test(op.path)
          ) {
            logMessages = {
              ...logMessages,
              stack: [
                ...logMessages.stack,
                {
                  role: 'log',
                  title: `Tool Output`,
                  content: op.value['output'],
                },
              ],
            }

            thunkAPI.dispatch(setMessages([...messages, logMessages]))

            console.log('Tool Calls (Agent) Output:', op.value['output'])
          }
        }
      }
    }

    console.log('Response:', finalResponse)

    const finalResponseMessage: ChatMessage = {
      role: 'assistant',
      content: finalResponse ?? '',
      tool_calls: toolCalls,
      tool_choice: 'none',
      isStreaming: false,
      isCancelled: (thunkAPI.getState() as RootState).chat.loadingState === 'cancelled-by-user',
    }

    // Add the assistant's response to the chat history
    thunkAPI.dispatch(
      setMessages([
        ...messages,
        ...(logMessages.stack.length > 0 ? [logMessages, finalResponseMessage] : [finalResponseMessage]),
      ]),
    )

    return
  } catch (error) {
    console.log('LLM Backend Request Error:', error)
    thunkAPI.dispatch(
      addAlerts([
        {
          type: 'error',
          topic: 'Chat',
          message: `Interacting with LLM failed. ${error}`,
        },
      ]),
    )
    throw error
  }
}
