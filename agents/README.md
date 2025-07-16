# Evidence Creation LLM Agents

This directory contains a small TypeScript application and documentation for automated agents that gather project evidence from the web and UK government APIs and store it in the existing database. Language model calls are routed through the PortKey AI Gateway so providers can be switched via configuration.

See the [product requirements](prd.md) and [setup guide](setup.md) for details.

## Usage

1. Install dependencies:
   ```sh
   make install
   ```
2. Run the evidence collector with optional arguments:
   ```sh
   make run ARGS="--locale 'Yorkshire and the Humber' --limit 3"
   ```
   Evidence will be written to the database using Prisma.

3. Score projects based on their evidence:
   ```sh
   npx ts-node src/ragAgent.ts
   ```

