from langchain_core.language_models.base import BaseLanguageModel
from langchain_openai import ChatOpenAI, AzureChatOpenAI

from utils.get_env import get_env

llm_provider = get_env('LLM_PROVIDER')

# The name="ChatModel" is important for the streamLog parsing on the client side

if llm_provider == 'openai':
    model: BaseLanguageModel = ChatOpenAI(openai_api_key=get_env('OPENAI_API_KEY'), model_name=get_env('OPENAI_MODEL'), name='ChatModel')
    tool_model: BaseLanguageModel = ChatOpenAI(openai_api_key=get_env('OPENAI_API_KEY'), model_name=get_env('OPENAI_MODEL'), name='ToolChatModel')
elif llm_provider == 'azure':
    model: BaseLanguageModel = AzureChatOpenAI(
            azure_endpoint=get_env('AZURE_ENDPOINT'),
            api_version=get_env('AZURE_API_VERSION'),
            azure_deployment=get_env('AZURE_MODEL'),
            api_key=get_env('AZURE_API_KEY'),
            name='ChatModel'
        )
    tool_model: BaseLanguageModel = AzureChatOpenAI(
            azure_endpoint=get_env('AZURE_ENDPOINT'),
            api_version=get_env('AZURE_API_VERSION'),
            azure_deployment=get_env('AZURE_MODEL'),
            api_key=get_env('AZURE_API_KEY'),
            name='ToolChatModel'
        )
else:
    raise ValueError(f"Invalid LLM provider: {llm_provider}")
