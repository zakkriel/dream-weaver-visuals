import { Text } from "../primitives/Text";

export type JourneyState = {
  active: boolean;
  kind: "travel" | "wait" | "watch";
  goal_label: string | null;
  where_label: string | null;
  progress: number;
  legs_done: number;
  legs_total: number;
  interruptible: boolean;
  status: "active" | "arrived" | "ended";
};

/**
 * "You are on your way" — the journey state, rendered from labels only.
 *
 * Every value here arrives phrased: where you are, where you are headed, how many legs are behind you.
 * This computes no distance, no ETA, no coordinate and no remaining time, because all of those are world
 * truth the frontend does not hold (D-7) and does not receive. `progress` is a number the backend chose,
 * drawn as a bar and nothing more.
 *
 * There is deliberately no cancel and no resume control. A journey advances one leg per Continue press,
 * and any other input ends it and runs as an ordinary turn where you stand (R5/R6) — so the affordance
 * for leaving a journey is simply typing something, which the input already offers.
 */
export function JourneyBar({ journey }: { journey: JourneyState }) {
  const arrived = journey.status === "arrived";
  const heading = arrived
    ? journey.goal_label
      ? `You arrive at ${journey.goal_label}.`
      : "You arrive."
    : journey.goal_label
      ? `On your way to ${journey.goal_label}.`
      : ONGOING[journey.kind];

  return (
    <section className="dc-journey" aria-label="Journey">
      <div className="dc-journey__line">
        <Text as="span" size="sm">
          {heading}
        </Text>
        <Text as="span" size="sm" tone="muted">
          {journey.legs_total > 0 ? `Leg ${journey.legs_done} of ${journey.legs_total}` : ""}
        </Text>
      </div>
      {journey.where_label && (
        <Text as="span" size="sm" tone="muted">
          {journey.where_label}
        </Text>
      )}
      <div
        className="dc-journey__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={journey.progress}
      >
        <div className="dc-journey__fill" style={{ inlineSize: `${journey.progress * 100}%` }} />
      </div>
      {!arrived && journey.interruptible && (
        <Text as="span" size="sm" tone="muted" italic>
          The world may still stop you.
        </Text>
      )}
    </section>
  );
}

/** What an unnamed journey of each kind reads as. The world names its own goals when it has one. */
const ONGOING: Record<JourneyState["kind"], string> = {
  travel: "On your way.",
  wait: "You wait.",
  watch: "You keep watch.",
};
