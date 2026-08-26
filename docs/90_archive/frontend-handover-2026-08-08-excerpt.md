# Excerpt — the predecessor's last handover, 2026-08-08 (addendum, 2026-08-09)

**Archived record. Two passages, kept verbatim.** The rest of that 282-line handover was deleted in
the 2026-08-26 consolidation: it describes PRs, contract pins, file paths and a toolchain from
`dreamchat-frontend`, the archived predecessor, and the parts of it that still bind are restated in
stronger form in the live repo. The verdict, with the citation for each deleted section, is in
`../CONSOLIDATION-2026-08-26.md`.

**Two lessons from the same handover were not archived, because they still bind.** They are live at
`../contract-versioning.md`.

What survives here is the material that is neither dead nor already restated: an in-flight backend
ruling, and a ledger of blocked acceptance criteria whose causes were verified in backend SQL rather
than assumed.

---

## A1. Knowledge grouping changed under us

*Verbatim from the 2026-08-09 addendum, §A1.*

**What the backend changed.** `collected_knowledge_groups` now groups **per source event**. Every
group's `group_key` is `event:<uuid>` and its `group_label` is that event's own label. The envelope
did not move — `actor_page/2`, and the schema still says only `group_key: string` — so nothing in
`verify:types` or `verify:contract` could have caught it.

**The defect.** Mara's dossier in the seeded Drowned Lantern rendered **25 `<h3>` headings, all
reading "Arrival", each over exactly one item.** Measured, not estimated:

```
groups: 25 · distinct group_key: 25 · every key event:<uuid>
group_label: {"Arrival": 25} · items per group: {1: 25}
```

The seeded world has one in-world time label so far, so every source event carries the same name and
the per-event split is invisible except as repetition.

**Why nothing was changed in the client.** `KnowledgeList` rendered `group_label` verbatim under
`group_key`, which is presentation of exactly what the payload said (**D-7**). Collapsing runs of
identical headings on the client is a rule about what those groups *mean* — whether two events sharing
a label are one section or two — and that is world truth. **A backend ruling was in flight.** The two
candidate outcomes and what each costs the client:

| Ruling | Client change |
|---|---|
| Backend groups semantically (a group per *meaning*, not per event) | none — the list already renders whatever it is handed |
| Backend keeps per-event groups and asks the client to collapse repeats | render one heading per **run** of consecutive identical `group_label`s, merging their items; `group_key` stays the React key. Requires the backend to state that consecutive identical labels are the same section, because that sentence is the world truth the client would be acting on |

> Do **not** collapse on label equality without that sentence. Two events genuinely named the same and
> genuinely distinct is a real case, and merging them would be the FE deciding an outcome (D-7, D-1).

**Status as of 2026-08-26: unknown to this repo.** Whether the ruling landed, and which way, was not
recorded here. The prohibition above stands either way — it is the safe default, not the interim one.
The surface this affected is not built in the live frontend, so nothing is blocked on it today.

---

## A2. Blocked acceptance criteria — causes verified in backend SQL

*Verbatim from the 2026-08-09 addendum, §A2, with one row corrected.* Kept because these were
**checked in the backend, not assumed**, which is what makes the list worth more than a to-do.

Newly met in that round: Actors AC#2, AC#3, AC#4 · Locations AC#4, AC#5 · the Actor portrait · the
narration-card portrait.

Still unmeetable, cause verified in backend SQL — blocked, not forgotten:

| AC | Blocker |
|---|---|
| Locations AC#2 | `part_of` is a stub |
| Locations AC#3 | `known_areas_inside` hardcoded `[]` |
| Artifacts AC#2 | type / location / holder all null |
| ~~Artifacts AC#1, AC#3~~ | ~~no `GET /worlds/{w}/carrying` — verified 404~~ — **STALE, corrected 2026-08-26.** That endpoint shipped. The live client reads it via `fetchCarrying()` in `src/api/index.ts`, pinned to `carrying/1`, and `src/fixtures/carrying.json` is a real capture. |
| Timeline AC#4 | no version identity in the payload |
| Actors — role subtitle | `perceived_role` is NULL |

> Every one of these is a payload gap. None is worth an FE workaround: inventing any of them is
> precisely the world truth this repo does not hold (D-7).

**Read the remaining five rows as dated, not current.** They were true on 2026-08-09 and one of the
six has since been disproved by the endpoint shipping — which is the reason each row names its cause.
A row whose cause you can go and check is worth keeping; a bare "blocked" is not. Verify against the
backend before relying on any of them.
