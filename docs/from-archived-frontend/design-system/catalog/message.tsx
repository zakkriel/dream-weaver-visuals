import { Inline } from "../primitives/Inline";
import { Stack } from "../primitives/Stack";
import { Text } from "../primitives/Text";
import { PortraitFrame } from "../primitives/PortraitFrame";

/**
 * How an attributed segment is voiced, as the wire names it: `beat_frame/1` narration frames carry
 * `message.kind`. (`beat_result/*` is backend test-only scaffolding and never reaches this client.)
 */
export type MessageKind = "narration" | "speech" | "action";

/**
 * One narration line: world prose, nobody's voice but the narrator's.
 */
function Narration({ text }: { text: string }) {
  return <Text>{text}</Text>;
}

/**
 * One attributed card. Speech is quoted as the speaker's own words; an action is a prose line about
 * them.
 *
 * `imageSrc` is a ready-to-use URL the caller built from the speaker's image reference — the design
 * system never knows an API path or a tier, the same seam the participants strip uses. Absent means
 * the world has shown no face for this speaker, which is the ordinary state and what the silhouette
 * is for (D-8); narration never waits on a picture.
 *
 * The portrait is DECORATIVE here — the speaker's name is the very next thing in the reading order,
 * so labelling the face would announce it twice.
 */
function Attributed({
  speaker,
  text,
  quoted,
  imageSrc,
}: {
  speaker: string;
  text: string;
  quoted: boolean;
  imageSrc?: string;
}) {
  return (
    <Inline gap={2} align="flex-start">
      <PortraitFrame src={imageSrc} alt="" size={32} />
      <Stack gap={1}>
        <Text as="span" size="sm" tone="muted">
          {speaker}
        </Text>
        {quoted ? <Text italic>{`“${text}”`}</Text> : <Text>{text}</Text>}
      </Stack>
    </Inline>
  );
}

/**
 * The catalog: one crafted component per message kind, keyed by the backend's tag (D-14 — one
 * rendering path per job). An unrecognised kind falls back to plain world prose, which is the honest
 * floor: the text still reaches the player, and the FE never invents an attribution it wasn't given.
 */
export function MessageSegment({
  kind,
  speaker,
  text,
  imageSrc,
}: {
  kind: string;
  speaker: string;
  text: string;
  imageSrc?: string;
}) {
  if (kind === "speech") return <Attributed speaker={speaker} text={text} quoted imageSrc={imageSrc} />;
  if (kind === "action")
    return <Attributed speaker={speaker} text={text} quoted={false} imageSrc={imageSrc} />;
  return <Narration text={text} />;
}
