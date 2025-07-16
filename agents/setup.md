# Evidence Agent Setup Guide

Follow these steps to run the evidence collection agents locally.

## Requirements
- Node.js (v18+)
- Access to the MySQL database used by the backend
- OpenAI API key or Google Gemini API key
- A `VIRTUAL_KEY` from PortKey for your preferred provider

## Installation
1. Clone the repository and install dependencies:
   ```sh
   cd agents
   npm install
   ```

2. Copy `.env.example` to `.env` and define:
   - `OPENAI_API_KEY` (or `GEMINI_API_KEY` if using Gemini)
   - `VIRTUAL_KEY` (points to your model provider in PortKey)
   - `DATABASE_URL` (matching the backend)
   - `MAX_RESULTS` (optional cap on results)
   - `LOCALE` (set to `yorkshire-and-the-humber` to enable locale mode)

## Running
```sh
npx ts-node example.ts --locale "$LOCALE" --limit "$MAX_RESULTS"
```
This will scrape configured sources, process the results using models through PortKey and insert new evidence via Prisma.

## Troubleshooting
- Ensure the database service is running (`make up` from the backend directory).
- Review log output for any failed HTTP requests or OpenAI errors.

