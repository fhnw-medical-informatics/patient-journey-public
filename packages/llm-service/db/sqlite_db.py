import logging
import os
import sqlite3

import pandas as pd
from langchain.sql_database import SQLDatabase
from langchain_community.vectorstores import Chroma

from db.clustering import calc_2d_and_clusters
from db.data_dir_contents import SQLITE_DB_FILE
from db.data_frames import concat_coordinates_and_cluster_to_patients
from db.shared import LoadedDataFrames

logger = logging.getLogger(__name__)


def prepare_sql_db(data_frames: LoadedDataFrames, coordinates_and_clusters_df: pd.DataFrame):
    # Create a connection to a new SQLite database
    conn = sqlite3.connect(SQLITE_DB_FILE)

    # Write the data from pandas DataFrames to the SQLite database

    patients_df = data_frames['patients']
    patients_clustered_df = concat_coordinates_and_cluster_to_patients(patients_df, coordinates_and_clusters_df)
    patients_clustered_df.to_sql('patients', conn, if_exists='replace', index=False)

    events_df = data_frames['events']
    events_df.to_sql('events', conn, if_exists='replace', index=False)

    # Close the connection to the database
    conn.close()

    logger.info("SQLite database has been created with patients and events tables.")


# Check if the patient journey reports have already been prepared and are plausible
def init_sqlite_db(data_frames: LoadedDataFrames, vector_store: Chroma) -> SQLDatabase:
    if not os.path.exists(SQLITE_DB_FILE):
        coordinates_and_clusters_df = calc_2d_and_clusters(vector_store)
        prepare_sql_db(data_frames, coordinates_and_clusters_df)

    return SQLDatabase.from_uri(f"sqlite:///{SQLITE_DB_FILE}")
