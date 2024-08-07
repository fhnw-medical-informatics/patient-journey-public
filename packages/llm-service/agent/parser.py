from typing import List, Union

from langchain_core.agents import AgentAction, AgentFinish
from langchain_core.exceptions import OutputParserException

from langchain.agents.output_parsers.openai_tools import OpenAIToolAgentAction


def handle_client_tool_calls(
    actions: Union[List[AgentAction], AgentFinish],
) -> Union[List[AgentAction], AgentFinish]:
    """Check if the actions are either a list of AgentActions or an AgentFinish message."""
    if isinstance(actions, AgentFinish):
        return actions
    elif isinstance(actions, list):
        for action in actions:
            if isinstance(action, OpenAIToolAgentAction):
                # if action.tool starts with "client_" then it is a client side tool -> return an AgentFinish message
                if action.tool.startswith("client_"):
                        try:
                            tool_calls = action.message_log[0].additional_kwargs['tool_calls']

                            return AgentFinish(
                                return_values={"output": "", "tool_calls": tool_calls}, log=str(action)
                            )
                        
                        except (IndexError, KeyError, AttributeError):
                            raise OutputParserException("The required 'tool_calls' data is missing in the message log.")
        return actions
    else:
        raise OutputParserException(
            f"Expected a list of AgentActions or an AgentFinish message, but got {actions}"
        )