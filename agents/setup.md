# Evidence Agent Setup Guide

Follow these steps to run the evidence collection agents locally.

## Requirements
- Node.js (v18+)
- OpenAI API key or Google Gemini API key

## Installation
1. From this directory install dependencies:
   ```sh
   make install
   ```
2. Copy `.env.example` to `.env` and define the variables:
   - `DEFAULT_PROVIDER`: Set to either `OPEN_AI` or `GEMINI` to choose your provider
   - `OPENAI_API_KEY` or `GEMINI_API_KEY`: Add the API key for your chosen provider
   - `MAX_RESULTS`: Maximum number of items to process
   - `LOCALE`: Default geographical area for evidence collection

## Running
```sh
make run ARGS="--locale $LOCALE --limit $MAX_RESULTS"
```
This will scrape sources, summarise them with the LLM and store the results in the database.

To update project RAG statuses based on their evidence:
```sh
npx ts-node src/ragAgent.ts
```
