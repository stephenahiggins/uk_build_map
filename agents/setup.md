# Evidence Agent Setup Guide

Follow these steps to run the evidence collection agents locally.

## Requirements
- Node.js (v18+)
- OpenAI API key or Google Gemini API key
- A `VIRTUAL_KEY` from PortKey for your preferred provider

## Installation
1. From this directory install dependencies:
   ```sh
   make install
   ```
2. Copy `.env.example` to `.env` and define the variables:
   - `OPENAI_API_KEY` (or `GEMINI_API_KEY`)
   - `VIRTUAL_KEY`
   - `MAX_RESULTS`
   - `LOCALE`

## Running
```sh
make run ARGS="--locale $LOCALE --limit $MAX_RESULTS"
```
This will scrape sources, summarise them using the LLM and store the results in `data/evidence.json`.
