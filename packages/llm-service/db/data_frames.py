import logging

import pandas as pd

from db.data_dir_contents import PATIENTS_CSV, EVENTS_CSV
from db.shared import LoadedDataFrames, DATE_FORMAT

logger = logging.getLogger(__name__)

# Maps PJ column types to SQLite column types
COLUMN_TYPE_MAPPING = {
    'pid': str,
    'eid': str,
    'string': str,
    'boolean': bool,
    'number': float,
    'timestamp': int,
    'category': 'category'
}

HEADER_ROW_COUNT = 2  # column name row + column type row

# Give ID columns stable names, so we can refer to them later
PATIENT_ID_COLUMN_NAME = 'Patient ID'
EVENT_ID_COLUMN_NAME = 'Event ID'


def find_duplicate_ids(ids):
    sorted_ids = sorted(ids)
    duplicate_ids = []
    for i in range(len(sorted_ids) - 1):
        if sorted_ids[i] == sorted_ids[i + 1]:
            duplicate_ids.append(sorted_ids[i])
    return duplicate_ids


def find_non_matching_id_refs(known_ids, id_refs):
    return list({id_ref for id_ref in id_refs if id_ref not in known_ids})


def check_data_consistency(patient_data, event_data):
    pids = patient_data[PATIENT_ID_COLUMN_NAME].tolist()
    duplicate_patient_ids = find_duplicate_ids(pids)
    if duplicate_patient_ids:
        raise ValueError(f"Patient data table contains non-unique pid values: {duplicate_patient_ids}")

    eids = event_data[EVENT_ID_COLUMN_NAME].tolist()
    duplicate_event_ids = find_duplicate_ids(eids)
    if duplicate_event_ids:
        raise ValueError(f"Event data table contains non-unique eid values: {duplicate_event_ids}")

    pid_refs = event_data[PATIENT_ID_COLUMN_NAME].tolist()
    non_matching_pid_refs = find_non_matching_id_refs(set(pids), pid_refs)
    if non_matching_pid_refs:
        raise ValueError(f"Event data table contains invalid pid references: {non_matching_pid_refs}")


def load_data_frames() -> LoadedDataFrames:
    patients_df = load_df(PATIENTS_CSV)
    events_df = load_df(EVENTS_CSV)
    logger.debug('Loaded data frames, checking consistency...')
    check_data_consistency(patients_df, events_df)
    return {'patients': patients_df, 'events': events_df}


def load_df(file_path: str) -> pd.DataFrame:
    column_headers_df = pd.read_csv(file_path, nrows=1)

    # In preparation for loading the full dataframe, we first need
    # to get a column type mapping from pj types to pandas types

    dtype_dict = {}
    date_columns = []
    new_column_names = column_headers_df.columns.tolist()
    rename_dict = {}

    for column_name in column_headers_df.columns:
        column_type = column_headers_df.iloc[0][column_name]
        if column_type == 'date':
            date_columns.append(column_name)
        if column_type in COLUMN_TYPE_MAPPING:
            dtype_dict[column_name] = COLUMN_TYPE_MAPPING[column_type]
        if column_type == 'pid':
            rename_dict[column_name] = PATIENT_ID_COLUMN_NAME
        if column_type == 'eid':
            rename_dict[column_name] = EVENT_ID_COLUMN_NAME

    # If there are columns to rename, adjust the column names list
    if rename_dict:
        new_column_names = [rename_dict.get(col, col) for col in new_column_names]
        dtype_dict = {rename_dict.get(col, col): dtype for col, dtype in dtype_dict.items()}

    # Load the actual pandas dataframe (skip row 1 to avoid reading the column types)
    # Read date columns as text for now, so we can use to_datetime below (which allows to raise and handle errors)
    df = pd.read_csv(file_path, skiprows=[1], names=new_column_names, header=0, dtype=dtype_dict)

    # Convert date columns and report any format errors
    for date_column in date_columns:
        for i, date_value in enumerate(df[date_column]):
            try:
                pd.to_datetime(date_value, format=DATE_FORMAT, errors='raise')
            except ValueError:
                row_number = i + HEADER_ROW_COUNT + 1
                logger.error(
                    f"File {file_path}: Error parsing date at row {row_number}, column '{date_column}': {date_value}")

    return df


def concat_coordinates_and_cluster_to_patients(patients_df: pd.DataFrame, coordinates_and_clusters_df: pd.DataFrame) -> pd.DataFrame:
    return pd.concat([patients_df, coordinates_and_clusters_df], axis=1)
