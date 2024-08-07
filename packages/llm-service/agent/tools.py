import logging

from typing import List, Sequence

from operator import itemgetter


from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, MessagesPlaceholder, HumanMessagePromptTemplate
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_core.language_models.base import BaseLanguageModel
from langchain_core.vectorstores import VectorStore
from langchain.sql_database import SQLDatabase
from langchain.tools import tool, BaseTool
from langchain_core.pydantic_v1 import (
    BaseModel,
    Field,
)

from db.chroma_db import PID_METADATA_FIELD_NAME

# Define the maximum number of documents to retrieve from the vector store in tools
MAX_NR_OF_DOCUMENTS_TO_RETRIEVE = 5

logger = logging.getLogger(__name__)

def create_agent_tools(model: BaseLanguageModel, db: VectorStore, sqlite_db: SQLDatabase) -> Sequence[BaseTool]:
    # –––
    class FindPJToolInput(BaseModel):
        query: str = Field(description="A query to be used for a similarity search. The query should reflect the user's question in the sense that it represents the characteristics of the patient journey that the user is looking for.")
        pids: List[str] = Field(description="A list of patient IDs (PIDs) that will be used as a filter to only search within these patient journeys. If empty, no filter will be applied.")

    @tool("find-relevant-patient-journeys", args_schema=FindPJToolInput)
    def find_relevant_patient_journeys(query: str, pids: List[str]) -> List[str]:
        """
        Retrieve relevant patient journeys from the dataset via a similarity search based on a query.
        The documents in the vector store (patient journeys) contain embedded patient journey reports with all information about the patient and it's medical events.

        If a list of one or more Patient ID's (PID) is provided, it will be used as a filter and the search will only be performed within these patient journeys.
        
        The retrieved patient journeys are then returned to you for further processing to answer the users request.
        
        Since this tool uses a similarty search (NOT a structured query), it is suitable to search for conditions, traits or characteristics of patient journeys.
        It may also be used if no patient journeys could be found with other, more structured tools.
        """

        filter = {}

        if pids:
            # Create filter object
            filter = {
                    PID_METADATA_FIELD_NAME: {
                        '$in': pids
                    }
                }

        retriever = db.as_retriever(
            search_type="similarity",
            search_kwargs={
                "k": MAX_NR_OF_DOCUMENTS_TO_RETRIEVE,
                "filter": filter
            }
        )
        
        retrieval_chain = (
            RunnablePassthrough(lambda x: logger.debug(f"Retreiver Input: {x} – filter: {filter}"))
            | retriever
            | RunnablePassthrough(lambda x: logger.debug(f"Retreiver Output: {x}"))
        )

        return retrieval_chain.invoke(query)
    # –––

    # –––
    class GetPJToolInput(BaseModel):
        pids: List[str] = Field(description="A list of patient IDs (PIDs) you want to retrieve the patient journeys for. If empty, just the top 10 patient journeys will be returned.")

    @tool("get-specific-patient-journeys", args_schema=GetPJToolInput)
    def get_specific_patient_journeys(pids: List[str]) -> List[str]:
        """
        Retrieve specific patient journeys from the dataset for further inspection.
        The documents in the vector store (patient journeys) contain embedded patient journey reports with all information about the patient and it's medical events.

        If a list of one or more Patient ID's (PID) is provided, these specific patient journeys will be returned – otherwise just the top 10 documents will be returned.
        
        The retrieved patient journeys are then returned to you for further processing to answer the users request.
        """
        
        retrieval_chain = (
            {
                "pids": itemgetter("pids"),
            }
            | RunnablePassthrough(lambda x: logger.debug(f"Getter Input: {x}"))
            | RunnablePassthrough.assign(response = lambda x: db.get(ids=x['pids'], limit=None if x['pids'] else MAX_NR_OF_DOCUMENTS_TO_RETRIEVE))
            | RunnablePassthrough(lambda x: logger.debug(f"Getter Output: {x}"))
        )

        return retrieval_chain.invoke({"pids": pids})
    # –––

    # –––
    class FindSimilarPJToolInput(BaseModel):
        journey_description: str = Field(description="A rough description of a reference patient journey for to find similar patient journeys.")

    @tool("find-similar-patient-journeys", args_schema=FindSimilarPJToolInput)
    def find_similar_patient_journeys(journey_description: str) -> List[str]:
        """
        Find and return similar patient journeys based on a simple patient journey description.
        The tool will first create a synthetic patient journey from the rough description and then perform a similarity search to find similar patient journeys in the database.
        Therefore provide as much details as possible in the description to get the best results.

        The retrieved similar patient journeys are then returned to you (the assistant) for further processing.

        Example user questions this tool is suitable for:
        - I'm looking for patient journeys with diabetes.
        - Do we have patient journeys that have undergone eye surgery?
        """

        similarity_system_template = """
        You are a synthetic patient journey generator.

        You will generate a synthetic patient journey based on a simple description of that journey.
        You will use the provided examples as context to generate a synthetic patient journey in the same format and structure.

        You only answer with the generated journey, no other information or annotations.
        """

        patient_journey_description_template = """
        Please create a synthetic patient journey that matches the following description:

        {journey_description}
        """

        similarity_prompt = ChatPromptTemplate.from_messages(
            [
                SystemMessagePromptTemplate.from_template(similarity_system_template),
                HumanMessage(content=("Here are a few examples of patient journeys that you can use as context to generate a synthetic patient journey:")),
                MessagesPlaceholder(variable_name='examples'),
                HumanMessagePromptTemplate.from_template(patient_journey_description_template),
            ]
        )

        # TODO: What is a sensible similarity score threshold? -> 0.7 for now
        # TODO: Don't exceed max token context window
        similarity_retriever = db.as_retriever(
                                    search_type="similarity_score_threshold",
                                    search_kwargs={
                                        "score_threshold": 0.1, # Just give us "the most similar", as we only fetch k docs anyways.
                                        "k": MAX_NR_OF_DOCUMENTS_TO_RETRIEVE
                                        }
                                    )

        similarity_retrieval_chain = (
            RunnablePassthrough.assign(examples=lambda _: db.get(limit=5)['documents']) # TODO: Get 5 random documents as examples
            | RunnableParallel(
            {
                "journey_description": itemgetter("journey_description"),
                "examples": itemgetter("examples"),
            })
            | RunnablePassthrough(lambda x: logger.debug(f"Synthetic Data Generator Input: {x}"))
            | similarity_prompt
            | model
            | StrOutputParser()
            | RunnablePassthrough(lambda x: logger.info(f"Synthetic Data Generator Output: {x}"))
            | similarity_retriever
            | RunnablePassthrough(lambda x: logger.debug(f"Similarity Retriever Output: {x}"))
        )

        # TODO: Should we return the fetched similar patient journeys in a structured format so that we can
        # handle them in the client? --> Maybe return a list of PIDs and highlight them in the app?
        return similarity_retrieval_chain.invoke({"journey_description": journey_description})
    # –––

    # –––
    class FindPJStructuredToolInput(BaseModel):
        sqliteQuery: str = Field(description="A SQLite syntax compatible query (avoid ```sql or other markup) based on the database schema in the description, that would fetch the necessary data to answer the user's question.")

    @tool("find-patient-journeys-by-structured-query", args_schema=FindPJStructuredToolInput)
    def find_patient_journeys_by_structured_query(sqliteQuery: str) -> str:
        """
        Retrieve meta information or relevant structured information about patients and their patient journeys from an SQLite Database via a SQL query.
        
        Based on the SQLite table schema, provide an valid SQLite query that would answer the user's question. Ensure that the query is compatible with SQLite syntax and features.
        Provide the SQLite query only (so that it is directly ready to be executed on the SQLite database) – no additional markup or anything.

        The retrieved information from the database are then returned to you for further processing.
        If the tool is not able to retrieve the information, you may want to try other, less structured tools to retrieve the information.
        """

        # Execute the SQL query and return the response

        def run_query(query: str):
            try:
                return sqlite_db.run(query)
            except Exception as e:
                return str(e)

        sqlite_chain = (
            {
                "query": itemgetter("query"),
            }
            | RunnablePassthrough(lambda x: logger.info(f"SQLite Input: {x}"))
            | RunnablePassthrough.assign(
                response=lambda x: run_query(x["query"])
            )
            | RunnablePassthrough(lambda x: logger.debug(f"SQLite Output: {x}"))
        )

        return sqlite_chain.invoke({ "query": sqliteQuery })
    # –––
    
    # –––
    class ClientToolInput(BaseModel):
        pids: List[str] = Field(description="A list of patient IDs (PIDs)")

    @tool("client_tool_highlight_patient_journeys", args_schema=ClientToolInput)
    def client_tool_highlight_patient_journeys(pids: List[str]) -> None:
        """Visually highlight the patient journeys for the user in the app. Provide a list of PIDs (Patient ID's) to highlight the corresponding patient journeys in the app. The app will then highlight the patient journeys for the user."""
    # –––
    
    return [
        find_relevant_patient_journeys,
        get_specific_patient_journeys,
        find_similar_patient_journeys,
        find_patient_journeys_by_structured_query,
        client_tool_highlight_patient_journeys
    ]