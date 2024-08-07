import os
from dotenv import load_dotenv

load_dotenv('.env')
load_dotenv('.env.local', override=True)


def get_env(key: str) -> str:
    return os.getenv(key)
