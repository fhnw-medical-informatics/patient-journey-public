import logging
import time
from typing import List, Any, Set

from langchain.chains.query_constructor.base import AttributeInfo
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings, AzureOpenAIEmbeddings

from db.data_dir_contents import CHROMA_PERSIST_DIR, PATIENT_REPORTS_TXT
from utils.get_env import get_env

# Creates a Chroma DB instance containing embedded patient journey reports
# Either imports previously persisted state or – if absent – creates documents from an input file.

logger = logging.getLogger(__name__)

# OpenAI: 2048
# Azure: 16 https://learn.microsoft.com/en-us/azure/ai-services/openai/reference#embeddings
NR_OF_DOCS_TO_EMBED_AT_ONCE = 16

PID_METADATA_FIELD_NAME = 'PID'

metadata_field_info = [
    AttributeInfo(
        name=PID_METADATA_FIELD_NAME,
        description="The patient ID corresponding to the patient journey described in the document",
        type="string",
    ),
]

document_content_description = "A description of the patient journey, including symptoms, diagnoses, and treatments"


def create_documents(file_path: str, doc_ids_to_ignore: Set[str]) -> List[Document]:
    documents = []
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            pid = line.split()[0]
            if pid not in doc_ids_to_ignore:
                document = Document(page_content=line, metadata={PID_METADATA_FIELD_NAME: pid})
                documents.append(document)
            else:
                logger.debug(f"Skipping already existing document ${pid}")
    return documents


class LoggingEmbeddingsDecorator(Embeddings):
    delegate: Embeddings

    def __init__(self, delegate: Embeddings, /, **data: Any):
        super().__init__(**data)
        self.delegate = delegate

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"Embedding {len(texts)} documents...")
            start_time = time.time()
            result = self.delegate.embed_documents(texts)
            end_time = time.time()
            logger.debug(f"Embedding {len(texts)} documents took {round(end_time - start_time)} seconds.")
            return result
        else:
            return self.delegate.embed_documents(texts)

    def embed_query(self, text: str) -> List[float]:
        return self.embed_documents([text])[0]


def create_embedding_function(embedding_provider: str):
    if embedding_provider == "openai":
        model = get_env('OPENAI_EMBEDDING_MODEL')
        if model is None:
            raise ValueError("OpenAI embedding model is not set")
        """
        The OpenAIEmbeddings library handles embedding of texts, including those exceeding OpenAI's token limit,
        through a process of chunking, embedding each chunk individually, and then aggregating and normalizing
        these embeddings to form a final, representative embedding for each text.

        You can read more about this here:
        https://github.com/openai/openai-cookbook/blob/main/examples/Embedding_long_inputs.ipynb
        """
        return OpenAIEmbeddings(
            model=model,
            max_retries=5,
            show_progress_bar=True,
            chunk_size=NR_OF_DOCS_TO_EMBED_AT_ONCE,
            embedding_ctx_length=8191  # Max. tokens in a single document
        )
    elif embedding_provider == "azure":
        return AzureOpenAIEmbeddings(
            azure_endpoint=get_env('AZURE_ENDPOINT'),
            api_version=get_env('AZURE_API_VERSION'),
            azure_deployment=get_env('AZURE_EMBEDDING_MODEL'),
            api_key=get_env('AZURE_API_KEY'),
            max_retries=5,
            chunk_size=NR_OF_DOCS_TO_EMBED_AT_ONCE,
        )
    else:
        raise ValueError(f"Unknown embedding model: {embedding_provider}")


def init_chroma_db(total_patient_count: int) -> Chroma:
    db = Chroma(
        embedding_function=LoggingEmbeddingsDecorator(create_embedding_function(get_env('EMBEDDING_PROVIDER'))),
        persist_directory=CHROMA_PERSIST_DIR)

    try:
        already_embedded_doc_ids = set(db.get()['ids'])
        if len(already_embedded_doc_ids) != total_patient_count:
            docs = create_documents(PATIENT_REPORTS_TXT, already_embedded_doc_ids)
            logger.info(f"{len(docs)} new documents need to be embedded and added to the Chroma DB")
            for i in range(0, len(docs), NR_OF_DOCS_TO_EMBED_AT_ONCE):
                docs_to_embed = docs[i:i + NR_OF_DOCS_TO_EMBED_AT_ONCE]
                logger.debug(f"Submitting chunk of {len(docs_to_embed)} new documents to the embedding function")
                ids = list(map(lambda d: d.metadata[PID_METADATA_FIELD_NAME], docs_to_embed))
                db.add_documents(docs_to_embed, ids=ids)
                db.persist()
                logger.info(f"Added chunk of {len(docs_to_embed)} new embedded documents to the Chroma DB")
            logger.info(f"Added total of {len(docs)} new documents to the Chroma DB")
        else:
            logger.info('All documents already existing in the Chroma DB')
    except Exception as e:
        logger.error(f"Error while embedding documents into Chroma DB: {e}")
    finally:
        db.persist()

    return db
