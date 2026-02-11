# Evidence Agent Setup Guide

Follow these steps to run the evidence collection agents locally.

## Requirements
- Node.js (v18+)
- OpenAI API key (default) or Google Gemini API key

## Installation
1. From this directory install dependencies:
   ```sh
   make install
   ```
2. Copy `.env.example` to `.env` and define the variables:
   - `PROVIDER`: Set to `openai` (default) or `gemini`
   - `OPENAI_API_KEY` or `GEMINI_API_KEY`: Add the API key for your chosen provider
   - `MAX_RESULTS`: Maximum number of items to process
   - `LOCALE`: Default geographical area for evidence collection
   - `MODEL`: Optional model override (defaults to `gpt-5-mini`)
   - `OPENAI_MODEL` / `GEMINI_MODEL`: Optional provider-specific overrides

## Running
```sh
make run ARGS="--locale $LOCALE --limit $MAX_RESULTS"
```
This will scrape sources, summarise them with the LLM and store the results in the database.

To update project RAG statuses based on their evidence:
```sh
npx ts-node src/ragAgent.ts
```
