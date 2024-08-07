# MIMIC IV

**IMPORTANT**: In accordance with the [official data use agreement](https://physionet.org/news/post/gpt-responsible-use), the MIMIC dataset may only ever be used on the Azure OpenAI Service:

## Pre-Processed Datasets

The following pre-processed MIMIC datasets can be found on Teams (`Patient Journey > data > mimic > pre-processed-for-langserve-backend`).

### MIMIC Dataset v002

SQL only:

- UMAP instead of TSNE

### MIMIC Dataset v001

**Input Files:** `Patient Journey > data > mimic > cl6`

- `patients.csv`
- `events.csv`
- `notes.txt` rename to `patient_reports.txt`

**Settings:**

```
# .env
DATA_DIR=./data/mimic
LLM_PROVIDER=azure
AZURE_ENDPOINT=https://p-oai-hlsoai-01.openai.azure.com/
AZURE_API_VERSION=2024-02-15-preview
AZURE_MODEL=gpt-4-0613
AZURE_EMBEDDING_MODEL=text-embedding-ada-002
AZURE_API_KEY=<YOUR_API_KEY>
```
