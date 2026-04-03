# Growth MAP — seed batch 13

You are a research assistant. Using **web search**, find **verifiable** local-government-led or council-funded **infrastructure, regeneration, transport, or major public-works projects** for **each** local authority listed below. Scope: **United Kingdom**, evidence from roughly the **last 24 months** where possible.

## Authorities in this batch (use these exact `localAuthorityId` and `regionId` values)

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 405554dd-518f-4ff2-a895-d96048221270 | Walsall | E08000030 | Unassigned | ENGLAND |
| a8c9f880-1b45-4f30-aa1a-fa1d63f0bc01 | Waltham Forest | E09000031 | Unassigned | ENGLAND |
| 00bc7835-970c-4876-8d81-e6a5c9595f5c | Wandsworth | E09000032 | Unassigned | ENGLAND |
| 73dc1a7b-988d-4f1c-8ee2-7b8d01ff8bf0 | Warrington | E06000007 | Unassigned | ENGLAND |
| 587654ed-f27c-43bf-8a88-1e5a0e3f1760 | Warwick | E07000222 | Unassigned | ENGLAND |
| 76c1ad20-5680-40ad-9485-cd47cfd4fdd3 | Watford | E07000103 | Unassigned | ENGLAND |
| 6148e973-871b-48b6-bf49-96d74a448450 | Waverley | E07000216 | Unassigned | ENGLAND |
| e40fd0f5-a7d8-43c3-8b8a-e9b26d13fca9 | Wealden | E07000065 | Unassigned | ENGLAND |
| d9a99eef-a4b8-4753-a1fa-465f430a0b36 | Welwyn Hatfield | E07000241 | Unassigned | ENGLAND |
| 5d1ac344-2735-4c65-8dab-54b3e922fcb7 | West Berkshire | E06000037 | Unassigned | ENGLAND |
| 17eb048e-c268-4b5a-b80b-92469c4efa3d | West Devon | E07000047 | Unassigned | ENGLAND |
| 2331c02a-6411-44c3-a795-128e08e9ee6d | West Lancashire | E07000127 | Unassigned | ENGLAND |
| a000dccd-285c-4e72-a57f-4913f58c5a31 | West Lindsey | E07000142 | Unassigned | ENGLAND |
| 84371d60-45d9-4dc3-a0e9-423ceb3c90ef | West Northamptonshire | E06000062 | Unassigned | ENGLAND |
| 78d875a9-73b6-4a30-b7b7-36b77a2bd359 | West Oxfordshire | E07000181 | Unassigned | ENGLAND |
| d90db92e-7ad8-4e34-9b01-cc8168e432ee | West Suffolk | E07000245 | Unassigned | ENGLAND |
| 2d82ae18-5429-475c-b3dc-210df969ffc8 | Westminster | E09000033 | Unassigned | ENGLAND |
| 5494ba48-d1d8-423a-ba0c-02ebf4a01583 | Westmorland and Furness | E06000064 | Unassigned | ENGLAND |
| 9f137a19-a0df-49f7-afd2-4069462499b3 | Wigan | E08000010 | Unassigned | ENGLAND |
| 32078f80-82c9-4156-8a0c-ea4d3379b89e | Wiltshire | E06000054 | Unassigned | ENGLAND |
| 407fd101-ad0e-478b-8d24-c05523cb01de | Winchester | E07000094 | Unassigned | ENGLAND |
| 56fd119b-5daa-45bf-ac3f-9bb0eb748d0c | Windsor and Maidenhead | E06000040 | Unassigned | ENGLAND |

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
4. **Save** your JSON array to `backend/seeds/claude-batches/out/batch-013.json` (create the `out` folder if needed).
