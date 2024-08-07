import logging
from operator import itemgetter
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, FileResponse
from fastapi.responses import PlainTextResponse
from langchain.globals import set_verbose
from langchain.pydantic_v1 import BaseModel
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langserve import add_routes

from agent.agent import create_agent
from data.init_data import init_data
from db.data_dir_contents import EVENTS_CSV
from utils.get_env import get_env

# set_debug(True)
set_verbose(True)

logging.basicConfig(
    level=get_env('LOG_LEVEL'),
    format='%(levelname)s:     %(message)s'
)

logger = logging.getLogger(__name__)

# Initialize the data
vector_store, structured_db, patients_csv = init_data()

# Create the agent
agent_executor = create_agent(vector_store, structured_db)

# Define the agent chain
chain = (
        RunnablePassthrough.assign(last_question=lambda x: x["conversation"][-1]['content'])
        | RunnablePassthrough.assign(schema=lambda _: structured_db.get_table_info())
        | RunnableParallel(
                {
                    "conversation": itemgetter("conversation"),
                    "last_question": itemgetter("last_question"),
                    "schema": itemgetter("schema"),
                    "selected_patient": itemgetter("selected_patient"),
                    "cohort": itemgetter("cohort"),
                }
            )
        | agent_executor
        | RunnablePassthrough(lambda x: logger.debug(f"Chain Ouput: {x}"))
)


# Add typing for input with only chat history
class ChatInput(BaseModel):
    conversation: List[dict]
    selected_patient: str = None
    cohort: List[str] = None


chain = chain.with_types(input_type=ChatInput)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def redirect_root_to_docs():
    return RedirectResponse("/docs")


@app.get("/patients")
async def get_patients_data():
    return PlainTextResponse(patients_csv, media_type="text/csv",
                             headers={"Content-Disposition": "attachment; filename=patients.csv", "Cache-Control": "no-store, max-age=0"})


@app.get("/events")
async def get_events_data():
    return FileResponse(EVENTS_CSV, media_type='text/csv', filename='events.csv', headers={"Cache-Control": "no-store, max-age=0"})


add_routes(app, chain, path="/rag")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
