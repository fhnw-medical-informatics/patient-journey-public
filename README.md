# Patient Journey

An app to explore patient journeys, powered by large language models.

**This is a research project. Please use at your own risk.**

&copy; FHNW Medical Informatics 2023/24

## Getting Started

This project uses [Bun](https://bun.sh/) as a package manager, test runner, etc. If you haven't installed Bun, you can do so by following the instructions on the [official website](https://bun.sh/).

### Prerequisites

1. Install [Bun](https://bun.sh/)
2. Install Backend [Pre-Requisites](packages/llm-service/README.md#development-pre-requisites)

### Installation

1. Clone the repo
2. Install TypeScript packages
   ```
   bun install
   ```
3. Install Python packages
   ```
   cd packages/llm-service
   poetry install
   ```

### Available Scripts

From the project root, you can run:

#### `bun run start`

Runs the app in the development mode. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

This command runs the vite development server for the app, as well as the `langchain` backend in the background.

#### `bun run build`

Builds the app and all services for production.

#### `bun run test:ci`

Launches the test runner for all packages in the CI (non-interactive) mode.

#### `bun run lint`

Lints the project using ESLint.

#### `bun run prettier`

Formats the project using Prettier.
