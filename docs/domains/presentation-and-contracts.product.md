# presentation-and-contracts · product

**Repo:** `dream-weaver-visuals` · **Cluster:** UX-3 · The frontend as a repository ·
**Parent bounded context:** Compendium & Play UX

This file holds what the domain *means* — its job, its language, its product rules, what is
deliberately not built. `presentation-and-contracts.tech.md` holds how it is built;
`presentation-and-contracts.seams.md` holds what crosses its boundary.

---

## What this domain is for

**One job: everything on screen is traceable to a contract, and nothing on screen is invented.**

`AGENTS.md` opens with the seam this domain is the engineering half of: *"Lovable owns how it looks.
The engineering side owns what is true."* A design tool pushes to `main`; this domain is the fence
that makes that safe — the vendored contracts, the version pins, the transport, the fixtures, and the
law tests that scan what a route can reach. The product reason it exists: *"Filling the hole
client-side is the one thing that cannot be undone quietly, because it looks like it works"*
(`AGENTS.md:55-56`).

## Ubiquitous language

| Term | Means, precisely |
|---|---|
| **Pin** | An exact `schema_version` string in the `const PIN` block, `src/api/index.ts`. String equality; a mismatch fails the load. Never a family check. |
| **Vendored contract** | A byte-identical copy of a backend published schema, in `contracts/` (`ADR-W004`). |
| **Capture / fixture** | A real payload recorded from a running backend, in `src/fixtures/`, declaring its `schema_version`. Distinct from a **mock** — hand-authored, never allowed beside captures (`src/laws/fixtures.test.ts:72-78`). |
| **Law test** | A test in `src/laws/` that checks a *rule*, not appearance, over the route-reachable file set. "The test is right until proven otherwise" (`docs/handoff/port-back.md` §Tests). |
| **The thirteen rules** | `docs/handoff/README.md` §3 — the law list for the visual side, authoritative only through the backend rule id each cites (`D-6`). |
| **Reference vs law** | `docs/handoff/reference-vs-law.md` — the strike table over the founder's own mockups, which *"contain adjudicated violations."* Verdicts current and binding; its archived measurements historical. |
| **Fixture mode** | The bundled-capture fallback for a genuinely backendless environment. Entered only one way (`tech.md` §Read path); never on 404, never for history. |

## What this domain is not

- **Not the look.** Lovable owns `src/components/dc/`, `src/components/ui/`, `src/styles.css`,
  `src/assets/`, `public/` — this domain never restyles them (`AGENTS.md` §The seam).
- **Not the play surface's rendering.** UX-2 owns what the screens do with the typed props this
  domain hands them.
- **Not the compendium projections.** UX-1 (backend) decides what a page carries; this domain vendors
  the schema and renders the payload.
- **Not perception.** The payload arrives already perception-scoped (`B-1`); this repo *"writes
  nothing and never performs a knowledge check"* (`D-7`; `digest/01_TOPIC_MAP.md` §UX-3).

## Product rules — decisions already made

Cited, never restated. The thirteen-rule list itself is `docs/handoff/README.md` §3; these are the ids
that govern hardest here.

| Id | What it settles | What breaks if you ignore it |
|---|---|---|
| `D-7` | The frontend owns presentation only: render world text verbatim, never invent a field, never decide an outcome. | An invented value looks like it works. |
| `B-1`, `I-3` | Absence is the answer: no withheld-vs-nonexistent distinction — one `NOT_FOUND` sentinel (`src/api/index.ts:103-105`). | A "locked/hidden" affordance leaks what the character has not earned. |
| `D-4` | Every payload carries `schema_version` and is validated — the pin. | Reading a v4 payload through v3 field access. |
| `B-5` | No wall-clock, ever; ticks order and are never displayed. | "Seen 1h ago" states a time the world does not have. |
| `GA-2`, `F-1` | Glossary vocabulary: Actors, Locations, Artifacts, Timeline. Engine tokens never reach the screen. | Database vocabulary on a nav rail. |
| `D-14` | One rendering path per job; no navigation to surfaces that do not exist; catalog actions are backend-generated data. | "A nav item that goes nowhere is a promise the product cannot keep." |
| `D-15` | The FE is a neutral skeleton of named slots; a theme changes visuals only. | A theme that changes behaviour is a second rendering path. |
| `C-11` | No corrections, approval, or pending-change UI. | A review queue makes world direction feel like debugging. |

## What is deliberately not built here

- **The five compendium contracts are UNBUILT, not dead — and not vendored.** The backend serves all
  five today; this repo's absence is deliberate with a stated return condition, and seven captured
  fixtures are staged pin-current while nothing imports them (`docs/CONSOLIDATION-2026-08-26.md`
  decision 4). Vendoring early is forbidden — *"a pin on a payload nothing renders gates on nothing"*
  (`scripts/verify-contract.sh:15-17`); add the schema the same commit a surface reads it.
- **The four compendium nav destinations are absent on purpose.** *"Those four return here the day
  those surfaces do; naming them now would be four more dead buttons"*
  (`src/components/dc/DashboardRail.tsx:11-13`). The one live breach of this rule is a known open
  ruling (see `tech.md` §Open questions).
- **No viewer selector, no "view as".** Whose perception is on screen is decided server-side
  (rule 12, `D-7`; enforced at `src/laws/laws.test.ts`, the `?viewer=` ban).
- **The severity tokens stay unused.** `--dc-status-high/med/low` exist and no page renders them —
  *"the correct state. Leave it that way"* (`docs/handoff/reference-vs-law.md` §The severity row).
  Wiring one is shipping the taxonomy `GA-3` forbids, and it will look like housekeeping in the diff.
- **The mock server is not repaired.** Re-emitting its payloads at current pins is *"a code round with
  its own verification, deliberately not done"* (`CONSOLIDATION-2026-08-26.md` decision 3). It is a
  record of twelve states the live engine cannot produce on demand, not a running tool.
