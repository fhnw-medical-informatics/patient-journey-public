import csv
import logging
import os
import ast
from io import StringIO

import pandas as pd
from langchain.sql_database import SQLDatabase

from db.chroma_db import init_chroma_db
from db.data_dir_contents import DATA_DIR, PATIENTS_CSV, PATIENT_REPORTS_TXT, EVENTS_CSV, HASH_FILE
from db.data_frames import concat_coordinates_and_cluster_to_patients
from db.data_frames import load_data_frames
from db.prepare_patient_journeys import init_patient_journeys
from db.shared import COORDINATES_AND_CLUSTER_COLUMN_NAMES, COORDINATES_AND_CLUSTER_COLUMN_TYPES, DATE_FORMAT
from db.sqlite_db import init_sqlite_db
from utils.get_env import get_env
from utils.hash import calculate_hash

logger = logging.getLogger(__name__)


def init_data():
    logger.info(f"Initializing data from {DATA_DIR} ...")

    # MIMIC data use agreement
    if 'mimic' in DATA_DIR and ((get_env('LLM_PROVIDER').lower() == 'openai') or (
            get_env('EMBEDDING_PROVIDER').lower() == 'openai')):
        error_msg = f"""
It looks like your data directory contains MIMIC data.
In accordance with the data use agreement, you must not send this data to OpenAI.

Your current settings:

  DATA_DIR={DATA_DIR}
  LLM_PROVIDER={get_env('LLM_PROVIDER')}
  EMBEDDING_PROVIDER={get_env('EMBEDDING_PROVIDER')}
  
"""
        logger.error(error_msg)
        raise ValueError(error_msg)

    # Load patients & events data frames
    data_frames = load_data_frames()

    # Initialize the patient journeys
    init_patient_journeys(data_frames)

    # Create hash from input files and check if they changed
    # –––
    # Concatenate the contents of the three files and pipe to md5sum to get a single checksum
    hash = calculate_hash(PATIENTS_CSV, EVENTS_CSV, PATIENT_REPORTS_TXT)

    if os.path.exists(HASH_FILE):
        with open(HASH_FILE, 'r') as file:
            old_hash = file.read().strip()
            if old_hash == hash:
                logger.info("Data consistency check passed, no changes since last run")
            else:
                error_msg = """
🚨 The data you are loading has changed since last run!

Please make sure that you have the right patients, events and patient reports files.
If you want to proceed with new data, please…

- Delete the hash file
- Delete the chroma persist directory
- Delete the SQLite data file

…and restart the service.
"""

                logger.error(error_msg)
                raise ValueError(error_msg)
    else:
        # Write the hash to the file
        with open(HASH_FILE, 'w') as file:
            file.write(hash)
            logger.info("Data loaded for the first time, hash written to file")
    # –––

    # Initialize the vector store
    vector_store = init_chroma_db(len(data_frames['patients']))

    # Initialize the SQLite database
    structured_db = init_sqlite_db(data_frames, vector_store)

    # Create patients CSV (based on data frames & coordinates/clusters from DB)
    patients_csv = create_patients_csv(data_frames['patients'], structured_db)

    return vector_store, structured_db, patients_csv


def create_patients_csv(patients_df: pd.DataFrame, db: SQLDatabase) -> str:
    output = StringIO()
    csv_writer = csv.writer(output, lineterminator='\n')

    # Reconstruct patient journey column names
    column_headers = pd.read_csv(PATIENTS_CSV, nrows=1, header=None).iloc[0].astype(str).tolist()
    column_headers.extend(COORDINATES_AND_CLUSTER_COLUMN_NAMES)
    csv_writer.writerow(column_headers)

    # Reconstruct patient journey column types
    column_type_headers = pd.read_csv(PATIENTS_CSV, skiprows=1, nrows=1, header=None).iloc[0].astype(str).tolist()
    column_type_headers.extend(COORDINATES_AND_CLUSTER_COLUMN_TYPES)
    csv_writer.writerow(column_type_headers)

    # Concatenate coordinates & clusters from SQL db
    column_names = ', '.join('\"' + col + '\"' for col in COORDINATES_AND_CLUSTER_COLUMN_NAMES)
    result_string = db.run(f'SELECT {column_names} from patients')
    result_list_of_triplets = ast.literal_eval(result_string)
    coordinates_and_clusters_df = pd.DataFrame(result_list_of_triplets, columns=COORDINATES_AND_CLUSTER_COLUMN_NAMES)

    df = concat_coordinates_and_cluster_to_patients(patients_df, coordinates_and_clusters_df)
    df.to_csv(output, index=False, date_format=DATE_FORMAT, header=False)
    return output.getvalue()
