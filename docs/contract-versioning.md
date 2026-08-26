# The two ways an exact pin still goes stale

> **Provenance.** Both incidents below were recorded in the archived predecessor frontend's
> 2026-08-08 handover; the passages survive at
> `90_archive/frontend-handover-2026-08-08-excerpt.md`. The incidents are historical. **The two
> failure modes are current** — they are properties of how the contracts are versioned, not of that
> codebase — and neither is stated anywhere else in this repo.

`AGENTS.md` § *Data* covers the discipline: every pin is matched by string equality, and a mismatch
fails the load rather than reading one version's payload through another's field access. That
discipline is sound and it has caught real drift.

**It has two blind spots, and each has been hit once.** Both are cases where the pin is correct, the
gate is green, and the payload has changed anyway. Neither is a reason to distrust the pins; they are
the two questions the pin does not answer.

---

## 1. The version did not change, and the schema did

A payload can embed another payload. When the inner one moves, **the envelope's version does not
have to.**

The incident: `beat_frame`'s own version held while its *embedded* scene definition bumped. The
envelope announced nothing. From the handover:

> A nested payload announces a change without moving the envelope's version, so **"the version did not
> change" does not mean "the schema did not change."** `verify:contract` caught it; nothing else would
> have.

**This is still the shape of the live contract.** The beat frame still embeds a scene definition, and
today that nesting is visible in exactly one place: the name of the generated type imported at
`src/api/index.ts:5`. The version numbers of both the envelope and the nested payload are baked into
that identifier. Nothing else in the repo states the relationship, and no pin covers it — the pin
checks the envelope's `schema_version` string, which is precisely the field that did not move.

**What to do.** Run `bun run verify:contract` when a *nested* schema moves, even when no pin changes
and nothing in `const PIN` needs editing. It is the only gate that reads the schema bodies rather than
the version strings, which is why it was the only thing that caught this. Do not infer from a green
typecheck or an unchanged pin table that a contract is unchanged.

## 2. The schema did not change, and the data did

The mirror image, and the harder one, because no gate can catch it.

The incident: the backend changed how collected knowledge was **grouped** — the grouping key's
*meaning* changed per source event — while the envelope's version held and the schema still declared
only `group_key: string`. From the handover:

> nothing in `verify:types` or `verify:contract` could have caught it. This is the same lesson […]
> arriving from the other direction: **the schema did not change and the data did.**

A field's type can be stable while its semantics move underneath it. `string` does not say whether
two identical values mean one section or two, and no schema check can.

**The rule this produced, and it still binds:** when the meaning of a grouping or an ordering is the
question, that meaning is **world truth and the backend's to state.** The client renders what it is
handed and does not decide. The handover's own words, on whether the client should collapse
consecutive groups carrying identical labels:

> Do **not** collapse on label equality without that sentence. Two events genuinely named the same and
> genuinely distinct is a real case, and merging them would be the FE deciding an outcome (D-7, D-1).

**Where this is live in this repo.** Two consequences are already load-bearing, both in `AGENTS.md`:

- Transcript grouping is on `speaker_id` and **never** on the label. Two actors can carry the
  identical perceived label on purpose; grouping by label would fuse two people into one on screen
  (**B-1**).
- The remainder group in Collected Knowledge stays **unheaded and first**, and same-labelled groups
  are never merged.

Both are the same rule as the incident: an identical-looking value is not evidence of identical
meaning.

**What to do.** When a displayed grouping, ordering or collapse depends on values being "the same",
find the sentence in the backend's schema description or rules register that says so, and cite it. If
no such sentence exists, that is a backend ask — a normal and welcome one — not a client-side
judgement call.
