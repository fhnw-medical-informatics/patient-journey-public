import logging

from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough
from langchain.agents import AgentExecutor
from langchain.agents.format_scratchpad.openai_tools import (
    format_to_openai_tool_messages,
)
from langchain_core.utils.function_calling import convert_to_openai_tool
from langchain.agents.output_parsers.openai_tools import OpenAIToolsAgentOutputParser

from langchain_core.vectorstores import VectorStore
from langchain.sql_database import SQLDatabase

from agent.model import model, tool_model
from agent.tools import create_agent_tools
from agent.parser import handle_client_tool_calls

logger = logging.getLogger(__name__)

def create_agent(db: VectorStore, sqlite_db: SQLDatabase) -> AgentExecutor:
    system_template = """
    <Role>
        You are a medical expert and medical data analyist embedded within a data exploration app using patient journey data.
    </Role>

    <Goal>
        Your goal is to help the user analyze patient journeys and gain insights from the data.

        You provide concise answers to the user's questions regarding the patient dataset, by analyzing the dataset through your available tools, gain insights and provide the user with the most relevant information.
    </Goal>

    <Backstory>
        You are a pragmatic agent with broad medical knowledge, but also a deep data analysis background to navigate the complex patient journey dataset. Your expertise lies in understanding user questions and determine the best way to answer them using your knowledge and your available tools.

        If the user's question is ambiguous or requires further clarification, you prompt the user for additional information.

        Due to your pragmatic nature, you don't overthink the question or the approach to answer it, you just make sure to use what you have as best as you can.
    </Backstory>

    <Task>
        Provide a precise, concise answer to the user's question by querying the dataset and gain relevant insights from the data. You also take into account any relevant context information.

        Should the data not yield a clear answer, ensure the user is clearly informed about the limitations encountered.
    </Task>

    <Expected Output>
        A concise answer to the user's question, grounded in the analysis of the provided data.
        If a definitive answer cannot be sourced from the available data, the user must be explicitly informed of this, along with any relevant reasons or context.

        When you answer, you use a simple but "visual" language (like bullet points, highlighting important words, etc…) by using markdown styles.

        Answer in formats that are easy to understand for a human (e.g. readable date/time formats over milliseconds, etc…).
    </Expected Output>

    <Tool Use>
        You can use your available tools to answer the user's questions. You can also ask the user for more information if you need it to answer the question. If the use of one tool didn't yield enough information to answer the question, you can try different ways of querying, or use another tool in an effort to find relevant information. Since the tools provide different ways to access the data, a strategy where you use multiple tools could be beneficial and encouraged.
    </Tool Use>

    <SQLite Schema>
        {schema}
    </SQLite Schema>

    <App Context>
        The app you are embedded in, allows the user to visualize and explore patient journeys in various ways (timeseries on a timeline, clusters on a plot, sort and filter data, etc…). A patient journey is a sequence of medical events, like visits to specific units in a hospital, treatments, diagnoses, medications, etc. which describe the medical history of a patient. You can access the data through your available tools.

        Additionally you can use information from the user's application state if suitable to answer the question. The application state reflects what the user has been doing in the app and what the user has currently selected:

        <App state>
            Selected patient ID (PID): {selected_patient}
            Currently selected Cohort (List of PIDs): {cohort}
        </App state>
    </App Context>
    """

    prompt = ChatPromptTemplate.from_messages(
        [
            SystemMessagePromptTemplate.from_template(system_template),
            MessagesPlaceholder(variable_name="conversation"),
            MessagesPlaceholder(variable_name='agent_scratchpad')
        ]
    )

    tools = create_agent_tools(tool_model, db, sqlite_db)

    llm_with_tools = model.bind(tools=[convert_to_openai_tool(tool) for tool in tools])

    agent = (
            # TODO: Use something like "format_to_openai_tool_messages" to format the conversation?
            # This would give kind of a fallback for non-OpenAI models see ->
            # https://github.com/langchain-ai/langchain/blob/master/libs/langchain/langchain/agents/format_scratchpad/openai_tools.py
            RunnablePassthrough.assign(
                agent_scratchpad=lambda x: format_to_openai_tool_messages(
                    x["intermediate_steps"]
                )
            )
            | prompt
            | RunnablePassthrough(lambda x: logger.debug(f"Agent Input: {x}"))
            | llm_with_tools
            | RunnablePassthrough(lambda x: logger.debug(f"Agent Output: {x}"))
            | OpenAIToolsAgentOutputParser()
            | handle_client_tool_calls
    )

    agent_executor = AgentExecutor(tools=tools, agent=agent, verbose=True, handle_parsing_errors=True)

    return agent_executor