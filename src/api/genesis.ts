import { apiBase, apiFetch, SchemaMismatchError } from "./index";
import type { WorldGenesisFrame1ONESSEFrameOfPOSTWorldsGenesisAWorldBuildIsALongAuthoredActWithIntermediateResultsSoItStreamsForTheSameReasonABeatDoesEveryFrameNamesSomethingThatWasReallyAuthoredWorkingFramesCarryALineOfTheWorldSOwnLanguageAsEachPartLandsWorldIsTheTerminalSuccessCarryingTheIdYouCanNowEnterRefusedMeansTheBriefCouldNotBecomeAWorldAndSaysWhyErrorMeansTheMachineFailedAndSaysSoWithoutPretendingToBeTheWorldSVoiceThereIsDeliberatelyNoProgressPercentageNoETAAndNoStageListAClientMustNeverRenderANumberNothingProducedFrontendLaw2 as GenesisFrameT } from "./types/world_genesis_frame";
import type { WorldInterviewTurn1TheResponseToPOSTWorldsInterviewONEQuestionAboutABriefOrNothingLeftToAskTheExchangeIsSTATELESSTheClientSendsTheBriefAndEveryPriorAnswerAndReceivesOneTurnSoThereIsNoSessionNoStoredInterviewAndNothingToResumeDoneTrueArrivesWithNoQuestionAndIsAGoodAnswerNotAFailureABriefThatLeavesNothingUndeterminedShouldBeAskedNothingAndTheSurfaceAlwaysLetsTheUserBuildImmediatelyRegardless as InterviewTurnT } from "./types/world_interview_turn";

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

/** One thing the user was asked and what they said. Sent back on every subsequent call. */
export type InterviewAnswer = { question: string; answer: string };

/**
 * Pins for the two creation payloads, by exact string equality like every other contract here. When one
 * moves, the vendored schema, the generated type and this constant move in the same commit.
 */
const PIN = {
  interview: "world_interview_turn/1",
  genesisFrame: "world_genesis_frame/1",
} as const;

/** The maximum brief the server will accept (8 KiB there); mirrored so the surface can say so first. */
export const BRIEF_MAX_CHARS = 8000;

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
): Promise<void> {
  const res = await apiFetch(`${apiBase()}/worlds/genesis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brief, answers }),
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
