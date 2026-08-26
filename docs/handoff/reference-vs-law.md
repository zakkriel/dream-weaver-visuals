# The references vs the law — which mockup features are struck, and by which rule

> **Provenance.** Extracted 2026-08-26 from §3 of `../90_archive/gap-audit-2026-08-09.md`, a read-only
> audit written against the archived predecessor frontend after the founder rejected the look. **The
> rule verdicts below are current and binding.** The code measurements in the archived original are
> historical — it cites file paths (`src/ds/`, `src/pages/`) that no longer exist and a dev port that
> is retired. Read this file for the verdicts; read the original for how they were measured.

**Why this file exists.** The mockups and `pixel-perfect-companion` are the briefing material for
every visual round — and **they contain adjudicated violations.** The founder's own reference app
implements several. Adopting the visual language does not require adopting them, and that distinction
has to survive every restyle, which means it has to be written down where someone briefing a design
tool will see it.

`README.md` §3 is the law: thirteen numbered rules, each citing the backend rule ID that owns it. This
file is the per-feature verdict *on the reference material*. It adds no rules. Where a row cites a
bracketed id, the text lives in
`dreamchat-world-backend/docs/00_strategy/06_rules_register.md` (rule **D-6** — we restate, we do not
own).

---

## Struck — present in the references, MUST NOT be built

| In the reference | Where it appears | Rule | Why it stays out |
|---|---|---|---|
| **"Relationship to you"** card + trust slider | `mock_compendium_actor_seren_v2.png` | **B-3, B-4** | No relationship UI of any kind; the system never expresses the PC's feelings. |
| Nav item **"Relationships"** | `mock_gameplay_screen.png`; companion `LeftNav.tsx:15` | **B-3** | Adjudicated. A router test asserts its absence. |
| Nav item **"Entities"** | gameplay mockup; companion `LeftNav.tsx:13` | **GA-2, F-1** | Database vocabulary. The Glossary says **Actors**. |
| Nav item **"Possessions"** | actor + location mockups | **GA-2, F-1** | The Glossary says **Artifacts** / **Carrying**. |
| The **`Current \| Previously \| Open Threads`** strip | gameplay mockup; companion `RightPanel.tsx:32-34` | **GA-3** | A fixed taxonomy. The four aux-lens mockups are authoritative and show `Current / Inspect / Intent / Known`. |
| **High / Medium / Low severity** on threads | gameplay mockup; companion `--sev-high/medium/low` | **GA-3** + the urgency ban | An urgency score the world does not compute. |
| **"Linked to"** panel | actor + location mockups | Locations AC#4, struck | — |
| **Location hierarchy tree** beside a breadcrumb | location mockup | **C-12** | One expression of hierarchy only. |
| **"Seen 1h ago"** | location mockup | **B-5** | Wall-clock never appears. In-world labels only. |
| **"Add note"** | actor mockup | parked (AC#10d) | — |
| Interpretation confidence, **"High (82%)"** | `mock_aux_lens_intent.png` | **D-7** | No confidence field exists in the payload. Inventing one fabricates a reading of the player's own words. |
| Per-item **"You could…"** verbs | `mock_aux_lens_inspect_artifact.png` | **D-14** | Must be backend-generated data tagged by kind. Same reason the Carrying overlay ships no verbs. |

### One trap already loaded in this repo

⚠️ The severity row has a live edge. This repo **already ships** `--dc-status-high/med/low` and a
`Badge` bound to them — **defined, and used by no page.** That is the correct state.

**Leave it that way.** The tokens existing is not the violation; a surface rendering them is. A
restyle that "tidies up" by wiring an unused token to a panel ships the taxonomy GA-3 forbids, and it
will look like housekeeping in the diff.

---

## Pure taste — adopt freely

Cinzel display · Garamond-class body · a dedicated UI face · gold-on-near-black · gold hairline
borders at 32–65% alpha · gradient panel fills · the warm 1px inset top highlight · 18–28px radii ·
4-layer shadows with a gold bloom · film grain · floating islands with 20px gutters · gradient
dividers that fade at both ends · large circular portraits with rings and an active aura · slow
ambient motion (4.5s / 3.2s) · glass blur with saturation · full-bleed scene art under a scrim.

**None of these carries any semantic claim. All are safe.**

---

## Closed — the one item the audit left open

The audit's §3.3 asked for a ruling on **a speaker-attributed italic "stage direction" line beneath
the speech**, as the reference's dialogue card renders. Its reasoning was that producing a second line
client-side would be inventing narration (**D-7**), because the narration segment carried one text
field.

**That premise no longer holds, and the answer is yes — it is supported, and already specified.** The
narration segment now carries `{speaker_id, speaker_label, kind, text, quote}`, where `quote` is the
verbatim spoken words without quotation marks and `text` is the staging prose around them. Two lines
from two payload fields is rendering, not invention. See `../../AGENTS.md` § *Prose and speech are
separate fields* for the field-by-field contract and `.dc-action-body` for the italic voice.

**One rule comes with it:** `text` is legitimately empty when a line is delivered bare, which is
roughly half of live speech. Never render it unconditionally — an unconditional paragraph puts an
empty line above every bare line. There is a test for it.

Recorded as closed rather than deleted, so the question is not re-opened by someone reading the
archived audit on its own.
