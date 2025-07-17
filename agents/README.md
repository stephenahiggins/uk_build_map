# Evidence Creation LLM Agents

This directory contains a small TypeScript application and documentation for automated agents that gather project evidence from the web and UK government APIs and store it in the existing database. Language model calls are routed through the PortKey AI Gateway so providers can be switched via configuration.

See the [product requirements](prd.md) and [setup guide](setup.md) for details.

## Usage

1. Install dependencies:
   ```sh
   make install
   ```

2. Set up your environment variables:
   ```sh
   cp .env.example .env
   ```
   Then edit the `.env` file to add your API keys:
   - `DEFAULT_PROVIDER`: Set to either `OPEN_AI` or `GEMINI` to choose your provider
   - `OPENAI_API_KEY` or `GEMINI_API_KEY`: Add the API key for your chosen provider
   - Optional settings for `DATABASE_URL`, `MAX_RESULTS`, and `LOCALE`

3. Run the evidence collector with optional arguments:
   ```sh
   make run ARGS="--locale 'Yorkshire and the Humber' --limit 3"
   ```
   Evidence will be written to the database using Prisma.

4. Score projects based on their evidence:
   ```sh
   npx ts-node src/ragAgent.ts
   ```

