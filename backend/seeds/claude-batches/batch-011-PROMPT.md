# Growth MAP — seed batch 11

You are a research assistant. Using **web search**, find **verifiable** local-government-led or council-funded **infrastructure, regeneration, transport, or major public-works projects** for **each** local authority listed below. Scope: **United Kingdom**, evidence from roughly the **last 24 months** where possible.

## Authorities in this batch (use these exact `localAuthorityId` and `regionId` values)

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 3c567233-40ed-48a2-8b08-65eadf2efb09 | South Norfolk | E07000149 | Unassigned | ENGLAND |
| 860739d8-e2a7-4dea-b4cd-a90584c29031 | South Oxfordshire | E07000179 | Unassigned | ENGLAND |
| d1f5beb1-9690-4ae5-a2b9-8426cfc18b1e | South Ribble | E07000126 | Unassigned | ENGLAND |
| 0b1c9730-2667-40fd-ac45-92d80a367e5b | South Staffordshire | E07000196 | Unassigned | ENGLAND |
| 1b158d1b-185f-4751-9999-86bc44dfdf18 | South Tyneside | E08000023 | Unassigned | ENGLAND |
| c66ff654-a1e1-4f34-8882-d96060c07e73 | Southampton | E06000045 | Unassigned | ENGLAND |
| 572c1490-ae94-4374-b165-5a16dc43f668 | Southend-on-Sea | E06000033 | Unassigned | ENGLAND |
| 61ab05cf-5212-4632-b04f-fb9585633336 | Southwark | E09000028 | Unassigned | ENGLAND |
| d25e8559-1e76-43ec-8d85-ad2bb9b5196d | Spelthorne | E07000213 | Unassigned | ENGLAND |
| 4bb74bfa-a03e-424f-9b82-74e5adbb23d2 | St Albans | E07000240 | Unassigned | ENGLAND |
| 9db29c9f-fb30-42d5-b6a2-4de7303bc610 | St. Helens | E08000013 | Unassigned | ENGLAND |
| ce54087d-802c-47e1-8a93-7a92394a5bb1 | Stafford | E07000197 | Unassigned | ENGLAND |
| 0f3f9f7c-fd17-4372-8fe1-d46f497fcb8f | Staffordshire Moorlands | E07000198 | Unassigned | ENGLAND |
| 0feec820-58dd-4751-bc5e-d910b4190be4 | Stevenage | E07000243 | Unassigned | ENGLAND |
| 04b84554-6687-4755-852d-df78aadcdc31 | Stockport | E08000007 | Unassigned | ENGLAND |
| 501d6b6e-95b6-499b-8919-716b7279b3b9 | Stockton-on-Tees | E06000004 | Unassigned | ENGLAND |
| b5c82f1a-f6dd-455c-b215-d179931976f7 | Stoke-on-Trent | E06000021 | Unassigned | ENGLAND |
| 54d099bf-5db6-4bdf-8e53-86e0594a9799 | Stratford-on-Avon | E07000221 | Unassigned | ENGLAND |
| a6f8c820-5f90-4624-8461-489a3518595e | Stroud | E07000082 | Unassigned | ENGLAND |
| 08526dcf-19b7-4fd7-9d57-7122623c3a64 | Sunderland | E08000024 | Unassigned | ENGLAND |
| d62b55cf-3543-4cf8-a982-aaac041ea7c7 | Surrey Heath | E07000214 | Unassigned | ENGLAND |
| 4913c47e-4926-4305-ba51-1f01707f1d0b | Sutton | E09000029 | Unassigned | ENGLAND |

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
4. **Save** your JSON array to `backend/seeds/claude-batches/out/batch-011.json` (create the `out` folder if needed).
