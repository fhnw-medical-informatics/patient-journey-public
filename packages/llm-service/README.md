# LangServe RAG Backend

## Development Pre-Requisites

- Python >= 3.11
- [LangChain CLI](https://python.langchain.com/docs/get_started/installation)
  > - `pip install langchain-cli`
- [Poetry](https://python-poetry.org/)
  > - `curl -sSL https://install.python-poetry.org | python3 -`
  > - If you get a certificate error, you may need to `Install Certificates.command` from the `Install Certificates` package in the `Install` directory of your Python installation: `/Applications/Python\ 3.11/Install\ Certificates.command`
- Configure your AI provider and API key in the `.env.local` file

## Install Dependencies

```bash
poetry install
```

## Run Server

The server will be started through the scripts in the project root.
To start it independently:

```bash
poetry run langchain serve
```

## FHNW Azure OpenAI Studio

- Pre-Requisite: AZ Admin Account https://subito.fhnw.ch/home/suche/azadmin
- Administration of model deployments and API keys requires special privileges:
  - Use admin account to log into https://aka.ms/PIM
  - Navigate to "Azure-Ressourcen"
  - Find "p-rgr-hlsmint" and press "Aktivieren" (Begründung: e.g. "Azure OpenAI Studio")
  - Now you can access https://oai.azure.com
    - to edit deployments
    - to view the API key (Settings > Resource)

## Launch Playground Client

[http://127.0.0.1:8000/rag/playground](http://127.0.0.1:8000/rag/playground)

# Original README (as created via `langchain app new`)

## Installation

Install the LangChain CLI if you haven't yet

```bash
pip install -U langchain-cli
```

## Adding packages

```bash
# adding packages from
# https://github.com/langchain-ai/langchain/tree/master/templates
langchain app add $PROJECT_NAME

# adding custom GitHub repo packages
langchain app add --repo $OWNER/$REPO
# or with whole git string (supports other git providers):
# langchain app add git+https://github.com/hwchase17/chain-of-verification

# with a custom api mount point (defaults to `/{package_name}`)
langchain app add $PROJECT_NAME --api_path=/my/custom/path/rag
```

Note: you remove packages by their api path

```bash
langchain app remove my/custom/path/rag
```

## Setup LangSmith (Optional)

LangSmith will help us trace, monitor and debug LangChain applications.
LangSmith is currently in private beta, you can sign up [here](https://smith.langchain.com/).
If you don't have access, you can skip this section

```shell
export LANGCHAIN_TRACING_V2=true
export LANGCHAIN_API_KEY=<your-api-key>
export LANGCHAIN_PROJECT=<your-project>  # if not specified, defaults to "default"
```

## Launch LangServe

```bash
langchain serve
```

## Running in Docker

This project folder includes a Dockerfile that allows you to easily build and host your LangServe app.

### Building the Image

To build the image, you simply:

```shell
docker build . -t my-langserve-app
```

If you tag your image with something other than `my-langserve-app`,
note it for use in the next step.

### Running the Image Locally

To run the image, you'll need to include any environment variables
necessary for your application.

In the below example, we inject the `OPENAI_API_KEY` environment
variable with the value set in my local environment
(`$OPENAI_API_KEY`)

We also expose port 8080 with the `-p 8080:8080` option.

```shell
docker run -e OPENAI_API_KEY=$OPENAI_API_KEY -p 8080:8080 my-langserve-app
```
