from typing import TypedDict
import pandas as pd

DATE_FORMAT = '%d.%m.%Y'

COORDINATES_AND_CLUSTER_COLUMN_NAMES = ['2D X', '2D Y', 'Cluster']
COORDINATES_AND_CLUSTER_COLUMN_TYPES = ['number', 'number', 'category']


class LoadedDataFrames(TypedDict):
    patients: pd.DataFrame
    events: pd.DataFrame
