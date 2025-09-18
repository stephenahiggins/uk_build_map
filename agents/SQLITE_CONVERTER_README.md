# SQLite to Prisma Seed Converter

This helper script converts SQLite database output to Prisma seed format for the LFG Agents project.

## Features

- Converts SQLite database tables to Prisma seed JSON format
- Maps SQLite data types to Prisma enums
- Handles relationships between projects and evidence
- Generates both JSON data and executable Prisma seed files
- Preserves all project metadata including coordinates, status, and evidence

## Installation

The converter is already included in the project. Make sure you have the required dependencies:

```bash
npm install
```

## Usage

### Command Line Usage

```bash
# Convert SQLite database to Prisma seed format
npm run convert-sqlite <sqlite-db-path> [output-path]

# Examples:
npm run convert-sqlite ./data.db
npm run convert-sqlite ./data.db ./prisma/seed-data.json
```

### Programmatic Usage

```typescript
import { convertSqliteToPrismaSeed, createPrismaSeedFile } from './src/sqliteToPrismaSeed';

// Convert SQLite to JSON format
const seedData = await convertSqliteToPrismaSeed('./data.db', './prisma/seed-data.json');

// Create Prisma seed file
await createPrismaSeedFile(seedData, './prisma/seed.ts');
```

## Output Format

The converter produces data in the exact format you specified:

```json
[
  {
    "id": "crossrail-proj-id",
    "title": "Crossrail (Elizabeth Line)",
    "description": "A major new railway for London and the South East.",
    "type": "REGIONAL",
    "regionId": null,
    "localAuthorityId": null,
    "createdById": 1,
    "expectedCompletion": "2022-05-24T00:00:00Z",
    "status": "GREEN",
    "statusRationale": "Project complete.",
    "latitude": 51.5154,
    "longitude": -0.0721,
    "evidence": [
      {
        "type": "PDF",
        "title": "Crossrail Completion Report",
        "url": "https://content.tfl.gov.uk/evidencing-the-value-of-the-elizabeth-line.pdf",
        "description": "Final project report for the Elizabeth Line.",
        "datePublished": "2024-05-01"
      }
    ]
  }
]
```

## Database Schema Requirements

The converter expects your SQLite database to have the following tables:

### Project Table
- `id` (string)
- `title` (string)
- `description` (string, nullable)
- `type` (string - LOCAL_GOV, NATIONAL_GOV, REGIONAL_GOV)
- `regionId` (string, nullable)
- `localAuthorityId` (string, nullable)
- `createdById` (number)
- `expectedCompletion` (string, nullable)
- `status` (string - RED, AMBER, GREEN, nullable)
- `statusRationale` (string, nullable)
- `latitude` (number, nullable)
- `longitude` (number, nullable)
- `imageUrl` (string, nullable)
- `createdAt` (string)
- `statusUpdatedAt` (string)

### EvidenceItem Table (coordinates removed – evidence inherits project location)
- `id` (string)
- `projectId` (string)
- `submittedById` (number)
- `type` (string - PDF, URL, TEXT, DATE)
- `title` (string)
- `summary` (string, nullable)
- `source` (string, nullable)
- `url` (string, nullable)
- `datePublished` (string, nullable)
- `description` (string, nullable)
- `createdAt` (string)
- `moderationState` (string)

## Generated Files

The converter creates two files:

1. **JSON Data File** (`seed-data.json`): Contains the converted data in JSON format
2. **Prisma Seed File** (`seed.ts`): Executable Prisma seed script that can populate your database

## Running the Seed

After conversion, you can run the generated seed file:

```bash
# Add to package.json scripts
"seed": "ts-node prisma/seed.ts"

# Run the seed
npm run seed
```

## Data Mapping

The converter automatically maps:

- **Project Types**: `LOCAL_GOV`, `NATIONAL_GOV`, `REGIONAL_GOV`
- **Project Status**: `RED`, `AMBER`, `GREEN`
- **Evidence Types**: `PDF`, `URL`, `TEXT`, `DATE`
- **Dates**: Converts to ISO format
- **Coordinates**: Project-level latitude/longitude preserved; evidence inherits location
- **Relationships**: Links evidence to projects via projectId

## Error Handling

The converter includes comprehensive error handling:

- Warns about unknown enum values and defaults to safe values
- Handles invalid date formats gracefully
- Provides detailed logging of the conversion process
- Continues processing even if individual records fail

## Example

```bash
# Convert your SQLite database
npm run convert-sqlite ./my-projects.db

# This will create:
# - prisma/seed-data.json (JSON format)
# - prisma/seed.ts (Executable seed file)

# Run the seed to populate your database
npm run seed
```

## Troubleshooting

### Common Issues

1. **Database not found**: Ensure the SQLite database path is correct
2. **Permission errors**: Check file permissions for the database
3. **Schema mismatch**: Verify your SQLite tables match the expected schema
4. **Memory issues**: For large databases, consider processing in batches

### Debug Mode

Run with additional logging:

```typescript
// Add debug logging to the converter
console.log('Processing project:', project.title);
console.log('Evidence count:', projectEvidence.length);
```

## Integration with Existing Workflow

The converter integrates seamlessly with your existing Prisma setup:

1. Convert SQLite data to seed format
2. Run the generated seed file
3. Your database is populated with the converted data
4. Continue with normal application operations

This maintains data integrity while providing a clean migration path from SQLite to your Prisma-based system. 