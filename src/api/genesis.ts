import { apiBase, apiFetch, SchemaMismatchError } from "./index";
import type { ArtStyles1GETWorldsArtStylesSelectableWorldArtStylesInDisplayOrder as ArtStylesT } from "./types/art_styles";
import type { WorldGenesisFrame2ONESSEFrameOfPOSTWorldsGenesisAWorldBuildIsALongAuthoredActWithIntermediateResultsSoItStreamsForTheSameReasonABeatDoesEveryFrameNamesSomethingThatWasReallyAuthoredWorkingFramesCarryALineOfTheWorldSOwnLanguageAsEachPartLandsChoiceIsTheTerminalSuccessOfTheStreamTheStreamNowEndsInAChoiceNotAWorldTheWorldItselfArrivesLaterOnTheKickstartTurnSDoneTrueBecauseCommitNoLongerHappensInsideTheStreamRefusedMeansTheBriefCouldNotBecomeAWorldAndSaysWhyErrorMeansTheMachineFailedAndSaysSoWithoutPretendingToBeTheWorldSVoiceThereIsDeliberatelyNoProgressPercentageNoETAAndNoStageListAClientMustNeverRenderANumberNothingProducedFrontendLaw2 as GenesisFrameT } from "./types/world_genesis_frame";
import type { WorldInterviewTurn1TheResponseToPOSTWorldsInterviewONEQuestionAboutABriefOrNothingLeftToAskTheExchangeIsSTATELESSTheClientSendsTheBriefAndEveryPriorAnswerAndReceivesOneTurnSoThereIsNoSessionNoStoredInterviewAndNothingToResumeDoneTrueArrivesWithNoQuestionAndIsAGoodAnswerNotAFailureABriefThatLeavesNothingUndeterminedShouldBeAskedNothingAndTheSurfaceAlwaysLetsTheUserBuildImmediatelyRegardless as InterviewTurnT } from "./types/world_interview_turn";
import type { WorldKickstartTurn1TheResponseToPOSTWorldsGenesisKickstartSameGrammarAsTheInterviewTurnDoneFalseCarriesTheNextQuestionDoneTrueCarriesTheWorldBuiltAndPlayableTheFreeTextAnswerIsAPropertyOfTheSurfaceAndIsDeliberatelyNotEnumeratedHere as KickstartTurnT } from "./types/world_kickstart_turn";

/**
 * World creation, client side (backend PRD: `prd_world_creation.md`).
 *
 * Two calls, one brief. `askInterview` is the Custom lane and is STATELESS — this module sends the brief
 * and every answer so far on each call, because the server stores no interview and there is nothing to
 * resume. `buildWorld` streams the build, frame by frame, exactly as `streamBeat` streams a beat: a world
 * build is a long authored act with intermediate results, which is what that transport is for.
 *
 * Nothing here invents a displayed value (law 2). There is no progress percentage, no ETA and no stage
 * list, because the server sends none — what it sends is a line of the world's own language each time
 * something real was authored, and those render verbatim (law 1).
 */

export type GenesisFrame = GenesisFrameT;
export type InterviewTurn = InterviewTurnT;
export type InterviewOption = NonNullable<InterviewTurnT["options"]>[number];
export type KickstartTurn = KickstartTurnT;
export type ChoiceOption = NonNullable<KickstartTurnT["options"]>[number];
export type ArtStyles = ArtStylesT;
export type ArtStylePreset = ArtStylesT["styles"][number];

/** One thing the user was asked and what they said. Sent back on every subsequent call. */
export type InterviewAnswer = { question: string; answer: string };

/**
 * One optional art-style choice from the creation surface.
 *
 * `none` means "use the house look" and intentionally serializes to no `art_style` field at all.
 */
export type ArtStyleChoice =
  | { kind: "none" }
  | { kind: "preset"; key: string }
  | { kind: "custom"; text: string };

/**
 * Pins for the creation payloads, by exact string equality like every other contract here. When one
 * moves, the vendored schema, the generated type and this constant move in the same commit.
 */
const PIN = {
  artStyles: "art_styles/1",
  interview: "world_interview_turn/1",
  kickstart: "world_kickstart_turn/1",
  genesisFrame: "world_genesis_frame/2",
} as const;

/** The maximum brief the server will accept (8 KiB there); mirrored so the surface can say so first. */
export const BRIEF_MAX_CHARS = 8000;

/** A stable encoder for the genesis request's optional `art_style` field. */
export function serializeArtStyle(choice: ArtStyleChoice): string | undefined {
  if (choice.kind === "preset") return choice.key;
  if (choice.kind === "custom") {
    const text = choice.text.trim();
    return text === "" ? undefined : `custom:${text}`;
  }
  return undefined;
}

/**
 * The backend's art-style catalogue.
 *
 * This is the single source of truth for keys and copy. Consumers render what arrives; they do not
 * hardcode style names.
 */
export async function fetchArtStyles(): Promise<ArtStyles> {
  const res = await apiFetch(`${apiBase()}/worlds/art-styles`);
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  const list = (await res.json()) as { schema_version?: unknown };
  if (list.schema_version !== PIN.artStyles) {
    throw new SchemaMismatchError(PIN.artStyles, list.schema_version);
  }
  return list as ArtStyles;
}

/**
 * Ask what is still worth knowing about a brief. Returns `{ done: true }` when nothing is — which is a
 * good answer, not a failure, and the surface treats it as "ready to build".
 */
export async function askInterview(
  brief: string,
  answers: InterviewAnswer[],
): Promise<InterviewTurn> {
  const res = await apiFetch(`${apiBase()}/worlds/interview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brief, answers }),
  });
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  const turn = (await res.json()) as { schema_version?: unknown };
  if (turn.schema_version !== PIN.interview) {
    throw new SchemaMismatchError(PIN.interview, turn.schema_version);
  }
  return turn as InterviewTurn;
}

/**
 * An expired or spent kickstart handle (410). Distinguishable from every other failure mode because it
 * is a STATED refusal — the world answering "no, that draft is gone" — not a connection or server
 * failure, so callers route it to the refusal surface rather than the generic error one.
 */
export class ExpiredBuildError extends Error {}

/**
 * One kickstart answer in, the next question or the built world out. `answer` is a chosen option's
 * label or the user's own words — the server cannot tell and must not care.
 */
export async function answerKickstart(handle: string, answer: string): Promise<KickstartTurn> {
  const res = await apiFetch(`${apiBase()}/worlds/genesis/kickstart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle, answer }),
  });
  if (!res.ok) {
    if (res.status === 410) {
      throw new ExpiredBuildError("that build has expired — write the brief again and rebuild");
    }
    throw new Error(`request failed: ${res.status}`);
  }
  const turn = (await res.json()) as { schema_version?: unknown };
  if (turn.schema_version !== PIN.kickstart) {
    throw new SchemaMismatchError(PIN.kickstart, turn.schema_version);
  }
  return turn as KickstartTurn;
}

/**
 * Build the world and hand each frame to `onFrame` as it arrives.
 *
 * Two failure regimes, mirroring the server's and `streamBeat`'s: anything before the stream opens is an
 * ordinary HTTP status and throws here; once the status line is sent, every later failure arrives as a
 * `refused` or `error` frame. Callers must handle both — a refusal is not an exception, it is the world
 * saying no, and it carries the reason the user needs to read.
 */
export async function buildWorld(
  brief: string,
  answers: InterviewAnswer[],
  onFrame: (frame: GenesisFrame) => void,
  artStyle?: string,
): Promise<void> {
  const body: { brief: string; answers: InterviewAnswer[]; art_style?: string } = { brief, answers };
  if (artStyle !== undefined) body.art_style = artStyle;

  const res = await apiFetch(`${apiBase()}/worlds/genesis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  if (res.body === null) throw new Error("the build stream carried no body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // Frames are separated by a blank line; a partial tail stays buffered until its terminator arrives,
    // so a frame split across two network reads is never parsed in halves.
    let split = buffer.indexOf("\n\n");
    while (split !== -1) {
      dispatchGenesisFrame(buffer.slice(0, split), onFrame);
      buffer = buffer.slice(split + 2);
      split = buffer.indexOf("\n\n");
    }
  }
  dispatchGenesisFrame(buffer, onFrame); // a final frame the server did not terminate
}

/** Parse one SSE block and hand its frame over, version-checked like every other payload (D-4). */
function dispatchGenesisFrame(block: string, onFrame: (frame: GenesisFrame) => void): void {
  const json = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .join("");
  if (json === "") return;
  const frame = JSON.parse(json) as { schema_version?: unknown };
  if (frame.schema_version !== PIN.genesisFrame) {
    throw new SchemaMismatchError(PIN.genesisFrame, frame.schema_version);
  }
  onFrame(frame as GenesisFrame);
}
