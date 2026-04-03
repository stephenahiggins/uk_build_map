# Evidence Agent Setup Guide

Follow these steps to run the evidence collection agents locally.

## Requirements
- Node.js (v18+)
- Optional Google Gemini API key for live discovery. Connector-only and deterministic workflows do not require any paid API key.

## Installation
1. From this directory install dependencies:
   ```sh
   make install
   ```
2. Copy `.env.example` to `.env` and define the variables:
   - `PROVIDER`: Set to `gemini` when using live discovery
   - `GEMINI_API_KEY`: Optional live discovery key
   - `MAX_RESULTS`: Maximum number of items to process
   - `LOCALE`: Default geographical area for evidence collection
   - `MODEL`: Optional model override (defaults to `gemini-2.5-flash`)
   - `GEMINI_MODEL`: Optional provider-specific override

## Running
```sh
make run ARGS="--locale $LOCALE --limit $MAX_RESULTS"
```
This will scrape sources, summarise them with the LLM and store the results in the database.

To use connectors only and avoid LLM calls:
```sh
make run ARGS="--connectors-only --connectors local-json"
```

To update project RAG statuses based on their evidence:
```sh
npm run rag
```
