import tiktoken
import matplotlib.pyplot as plt

from db.data_dir_contents import PATIENT_REPORTS_TXT
from utils.get_env import get_env

# https://openai.com/pricing
EMBEDDINGS_API_COSTS_PER_1KTOKENS = 0.0001
EMBEDDING_MODEL_TOKEN_LIMIT = 8191 # text-embedding-ada-002

# Count tokens of individual patient journeys and visualize as histogram
# To run: (from inside packages/llm-service) `poetry run python utils/pj_token_counts.py`

def num_tokens_from_string(string: str, model_name: str) -> int:
    encoding = tiktoken.encoding_for_model(model_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens

def count_tokens_per_line(file_path):
    token_counts = []
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            count = num_tokens_from_string(line, get_env('AZURE_EMBEDDING_MODEL'))
            token_counts.append(count)
    return token_counts

def plot_histogram(token_counts):
    total_tokens = sum(token_counts)
    estimated_cost = total_tokens / 1000 * EMBEDDINGS_API_COSTS_PER_1KTOKENS
    plt.hist(token_counts, bins=range(min(token_counts), max(token_counts) + 1, 1), alpha=0.7, edgecolor='black')
    plt.title(f"Histogram of Token Counts per Line\n(Total: {total_tokens} tokens, Estimated embedding cost: ${estimated_cost:.4f})")
    plt.xlabel(f"Token Count (Total: {total_tokens})")
    plt.ylabel('Frequency')
    plt.axvline(x=EMBEDDING_MODEL_TOKEN_LIMIT, color='red', label='Token Limit')
    plt.show()

if __name__ == "__main__":
    token_counts = count_tokens_per_line(PATIENT_REPORTS_TXT)
    plot_histogram(token_counts)
