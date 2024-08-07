import os
from utils.get_env import get_env

DATA_DIR = get_env('DATA_DIR')

if DATA_DIR is None:
    raise ValueError("DATA_DIR environment variable is not set")


def f(name: str) -> str:
    return os.path.join(DATA_DIR, name)


PATIENTS_CSV = f('patients.csv')
EVENTS_CSV = f('events.csv')
PATIENT_REPORTS_TXT = f('patient_reports.txt')
HASH_FILE = f('hash.txt')
SQLITE_DB_FILE = f('data.db')
CHROMA_PERSIST_DIR = f('chroma-persist')
