# Growth MAP — seed batch 5

You are a research assistant. Using **web search**, find **verifiable** local-government-led or council-funded **infrastructure, regeneration, transport, or major public-works projects** for **each** local authority listed below. Scope: **United Kingdom**, evidence from roughly the **last 24 months** where possible.

## Authorities in this batch (use these exact `localAuthorityId` and `regionId` values)

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| ecb73cb6-20fb-4a6c-97a5-4361fe4a3e3a | Erewash | E07000036 | Unassigned | ENGLAND |
| 678a997b-6a4e-4a74-a304-af6ba65bae29 | Exeter | E07000041 | Unassigned | ENGLAND |
| 36234393-4bb0-4840-838e-27fa1f6750fd | Fareham | E07000087 | Unassigned | ENGLAND |
| c207efea-0c63-426d-98d6-c8baee48e656 | Fenland | E07000010 | Unassigned | ENGLAND |
| 42efa97b-cf9c-4ae4-b7ce-f0ef1f5518e4 | Folkestone and Hythe | E07000112 | Unassigned | ENGLAND |
| 7cd0b671-8334-47f0-bcee-a2ffa243b813 | Forest of Dean | E07000080 | Unassigned | ENGLAND |
| 99ed5a23-a490-40e5-bfc9-369398a40844 | Fylde | E07000119 | Unassigned | ENGLAND |
| 9ad351cc-4523-4686-a05c-1caf186c0083 | Gateshead | E08000037 | Unassigned | ENGLAND |
| 655643b4-044b-4423-b4c9-e16bb75c0244 | Gedling | E07000173 | Unassigned | ENGLAND |
| a775e6b5-e0c0-4259-8c92-d9a3b9510068 | Gloucester | E07000081 | Unassigned | ENGLAND |
| 0f79e13f-e088-45c6-8e6a-ba611cbad87f | Gosport | E07000088 | Unassigned | ENGLAND |
| 6b3bdaf4-2dc0-4491-b5ec-ef9426d998fc | Gravesham | E07000109 | Unassigned | ENGLAND |
| 54812331-ef56-4ee0-8aa2-308a16a39c82 | Great Yarmouth | E07000145 | Unassigned | ENGLAND |
| 332aa2ed-bb95-45e0-a548-5bb2caf8c5f6 | Greenwich | E09000011 | Unassigned | ENGLAND |
| 0d41e09c-c374-4867-aaee-8fb8d3dd16e8 | Guildford | E07000209 | Unassigned | ENGLAND |
| 90d5f587-9e3a-4439-ba00-fb44ebd20573 | Hackney | E09000012 | Unassigned | ENGLAND |
| c40c4dac-6ca9-43e3-a0c5-e7ed00589331 | Halton | E06000006 | Unassigned | ENGLAND |
| f5a751c5-f5ae-432d-a898-4cff1275795a | Hammersmith and Fulham | E09000013 | Unassigned | ENGLAND |
| f81f5051-60cc-47d8-aa4c-c7b98bfa74af | Harborough | E07000131 | Unassigned | ENGLAND |
| f39f2f94-072a-40a0-babb-af97997f1a5f | Haringey | E09000014 | Unassigned | ENGLAND |
| ceffd80f-96a7-44d5-9f47-e50f18a41da1 | Harlow | E07000073 | Unassigned | ENGLAND |
| a5680ade-8bd2-4ab7-9acf-e72fe75a27c6 | Harrow | E09000015 | Unassigned | ENGLAND |

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
4. **Save** your JSON array to `backend/seeds/claude-batches/out/batch-005.json` (create the `out` folder if needed).
