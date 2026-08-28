/* eslint-disable */
/**
 * This file was written to match contracts/world_identity_confirm.v1.schema.json.
 * Run gen:types when that schema moves.
 */
export type WorldIdentityConfirm1 = {
  schema_version: "world_identity_confirm/1";
  condition: { text: string; origin?: "axiomatic" | "contingent" };
  bargain: { text: string; therefore: string };
  departure: { neighbour: string; how_not: string };
  content_demand: { text: string; therefore: string };
  register: string;
  voice: [string, string, string] | string[];
  /** Opaque. Do not render. POST back on genesis. */
  identity: { [k: string]: unknown };
};
