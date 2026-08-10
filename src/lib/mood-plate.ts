import plateNocturne from "@/assets/plate-nocturne.jpg";
import plateMist from "@/assets/plate-mist.jpg";
import plateEmber from "@/assets/plate-ember.jpg";
import skyHero from "@/assets/sky-hero.jpg";

/**
 * House atmosphere plates, keyed by the payload's `theme.mood`.
 *
 * These are HOUSE art, not world art: nothing here claims to depict a world.
 * The payload carries no image for a world (NEEDS BACKEND FIELD: world.cover.path),
 * so an unknown mood simply gets the default plate — degrade, never fail.
 */
const PLATES: Record<string, string> = {
  nocturne: plateNocturne,
  mist: plateMist,
  ember: plateEmber,
  bleak: plateMist,
  daylight: skyHero,
};

export const housePlate = skyHero;

export function moodPlate(mood: string | null | undefined): string {
  return (mood && PLATES[mood.toLowerCase()]) || skyHero;
}
