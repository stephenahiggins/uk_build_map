# Growth MAP — seed batch 6

You are a research assistant. Using **web search**, find **verifiable** local-government-led or council-funded **infrastructure, regeneration, transport, or major public-works projects** for **each** local authority listed below. Scope: **United Kingdom**, evidence from roughly the **last 24 months** where possible.

## Authorities in this batch (use these exact `localAuthorityId` and `regionId` values)

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 684166e5-794a-45e7-9b24-5ce898db4715 | Hart | E07000089 | Unassigned | ENGLAND |
| 1e7725f8-ed24-485b-8ad8-98cd209ebfd0 | Hartlepool | E06000001 | Unassigned | ENGLAND |
| 368988bf-37ca-48cc-9fb7-24d510bed8fb | Hastings | E07000062 | Unassigned | ENGLAND |
| 6bc0c4b9-2b38-4cae-b800-87874214b5c2 | Havant | E07000090 | Unassigned | ENGLAND |
| 4da24c01-f0c0-4b74-aff3-0244727668a9 | Havering | E09000016 | Unassigned | ENGLAND |
| 9119ac8b-0ee8-4123-a063-eff4ba04e654 | Herefordshire, County of | E06000019 | Unassigned | ENGLAND |
| b06217cc-29da-4991-90d2-7c1c2ae08ee9 | Hertsmere | E07000098 | Unassigned | ENGLAND |
| 9b977417-5e3a-4c47-bba7-ea1bfb7fc7cf | High Peak | E07000037 | Unassigned | ENGLAND |
| fdc9a069-655c-42a5-8f80-818a34506c18 | Hillingdon | E09000017 | Unassigned | ENGLAND |
| d946cf16-c1dd-48f0-8ad1-b1f5605f43d8 | Hinckley and Bosworth | E07000132 | Unassigned | ENGLAND |
| bf43c2c4-faec-4bba-b278-42c7b3d7f27d | Horsham | E07000227 | Unassigned | ENGLAND |
| 4355cf65-9905-4235-8b4e-a825ee60e029 | Hounslow | E09000018 | Unassigned | ENGLAND |
| 4c20d442-3d63-4ea2-9056-ce2042c0b583 | Huntingdonshire | E07000011 | Unassigned | ENGLAND |
| 80db8ea7-c47b-4285-90a3-80975ddb2f24 | Hyndburn | E07000120 | Unassigned | ENGLAND |
| 915008de-38ff-4771-ab2b-fa5efaacb74c | Ipswich | E07000202 | Unassigned | ENGLAND |
| 56afd3c8-b958-4620-9d00-42a26319154f | Isle of Wight | E06000046 | Unassigned | ENGLAND |
| 27c18fd5-c335-4cda-881f-9422c60481d7 | Isles of Scilly | E06000053 | Unassigned | ENGLAND |
| 894c5daa-df59-4b85-a87a-1b3f768ca0d3 | Islington | E09000019 | Unassigned | ENGLAND |
| 3d764659-b3e6-4d0b-bc56-8ac1e07e3aaf | Kensington and Chelsea | E09000020 | Unassigned | ENGLAND |
| df6cbde2-ce09-4567-a4bf-c6f5b08524e5 | King's Lynn and West Norfolk | E07000146 | Unassigned | ENGLAND |
| 10dd16a9-49ca-45a6-b344-63bae1021561 | Kingston upon Hull, City of | E06000010 | Unassigned | ENGLAND |
| e4cf69d7-f5c7-48e0-b646-4c46773f5bb7 | Kingston upon Thames | E09000021 | Unassigned | ENGLAND |

## Output format

Return **only** a JSON **array** (no markdown fences, no commentary). Each element must be one project object suitable for `scripts/seedProjectsFromFile.ts`:

- `id`: unique string (e.g. slug or UUID).
- `title`, `description`, `type`: usually `LOCAL_GOV` for council schemes (or `REGIONAL_GOV` / `NATIONAL_GOV` if truly regional/national).
- `regionId`, `localAuthorityId`: **must** match one of the rows above for the authority the project belongs to.
- `createdById`: `1`.
- `status`: `GREEN`, `AMBER`, or `RED` from cited reporting.
- `statusRationale`: short, grounded in evidence.
- `latitude`, `longitude`, `locationDescription`, `locationSource`, `locationConfidence` when you can cite a site.
- `evidence`: array of objects with `type` (`URL` for links), `title`, `source`, `url` (real http(s) only), `datePublished` (ISO date), `summary`.

## Rules

1. **Do not invent URLs.** Every `url` must be a real page you could open.
2. If you cannot find solid projects for an authority, **omit** that authority rather than guessing.
3. Prefer official `.gov.uk` council sources, combined authorities, or reputable national/local press.
4. **Save** your JSON array to `backend/seeds/claude-batches/out/batch-006.json` (create the `out` folder if needed).
