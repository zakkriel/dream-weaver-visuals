import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { KnowledgeList } from "./KnowledgeList";
import { MetaPanel } from "./MetaPanel";
import { EmptyState } from "./EmptyState";

const group = {
  group_key: "g1",
  group_label: "Dark Foxes connection",
  items: [
    { perception_id: "p1", content: "Seen at the market", epistemic_type: "Observation",
      display_label: "Day 3", decay: { stale: true } },
  ],
};

describe("composed", () => {
  it("KnowledgeList renders groups, items, and stale marker", () => {
    const { getByText } = render(<KnowledgeList groups={[group]} emptyMessage="Nothing known." />);
    expect(getByText("Dark Foxes connection")).toBeInTheDocument();
    expect(getByText("Seen at the market")).toBeInTheDocument();
    expect(getByText(/last known/i)).toBeInTheDocument();
  });

  it("KnowledgeList shows the empty message when no items", () => {
    const { getByText } = render(<KnowledgeList groups={[]} emptyMessage="Nothing known." />);
    expect(getByText("Nothing known.")).toBeInTheDocument();
  });

  // Collected Knowledge is grouped by about-ness (`subject:<uuid>`). The group about the page's own
  // entity is the remainder: first, null-labelled, and rendered with NO heading — its items belong
  // directly under Collected Knowledge. Headed groups follow in the order given.
  it("KnowledgeList renders the null-labelled remainder group with no heading, in payload order", () => {
    const { container, getByText } = render(
      <KnowledgeList
        groups={[
          {
            group_key: "subject:2ac70000-0000-0000-0000-0000000000a1",
            group_label: null,
            items: [
              { perception_id: "r1", content: "You stepped into the Drowned Lantern.",
                epistemic_type: "direct", display_label: "Arrival", decay: {} },
            ],
          },
          {
            group_key: "subject:210c0000-0000-0000-0000-0000000000d1",
            group_label: "The Drowned Lantern",
            items: [
              { perception_id: "t1", content: "The hearth never quite dries the room.",
                epistemic_type: "direct", display_label: "Arrival", decay: {} },
            ],
          },
        ]}
        emptyMessage="Nothing known."
      />,
    );
    // Exactly one heading: the remainder invents none, and the topic group keeps its own.
    const headings = Array.from(container.querySelectorAll("h3")).map((h) => h.textContent);
    expect(headings).toEqual(["The Drowned Lantern"]);
    // The remainder's item still renders, above the headed group's.
    const contents = Array.from(container.querySelectorAll(".dc-knowledge__item")).map(
      (li) => li.textContent,
    );
    expect(contents[0]).toContain("You stepped into the Drowned Lantern.");
    expect(contents[1]).toContain("The hearth never quite dries the room.");
    expect(getByText("The Drowned Lantern")).toBeInTheDocument();
  });

  // The defect this ruling closed: 25 groups keyed by source event, every one labelled "Arrival".
  // Nothing in this component collapses repeats — that would be the client deciding two events are one
  // topic — so the pin is that it renders what it is handed, one heading per labelled group.
  it("KnowledgeList never merges same-labelled groups, and never reorders them", () => {
    const { container } = render(
      <KnowledgeList
        groups={[
          { group_key: "subject:b", group_label: "Kade", items: [
            { perception_id: "k1", content: "Kade nods to Mara.", epistemic_type: "shared",
              display_label: "Arrival", decay: {} }] },
          { group_key: "subject:c", group_label: "Kade", items: [
            { perception_id: "k2", content: "Kade mutters into his cup.", epistemic_type: "shared",
              display_label: "Arrival", decay: {} }] },
        ]}
        emptyMessage="Nothing known."
      />,
    );
    expect(Array.from(container.querySelectorAll("h3")).map((h) => h.textContent)).toEqual([
      "Kade",
      "Kade",
    ]);
  });

  it("MetaPanel + EmptyState render", () => {
    const { getByText } = render(<MetaPanel title="Last known"><EmptyState>—</EmptyState></MetaPanel>);
    expect(getByText("Last known")).toBeInTheDocument();
  });

  it("EmptyState standalone renders with muted+italic classes", () => {
    const { getByText } = render(<EmptyState>nothing known</EmptyState>);
    const el = getByText("nothing known");
    expect(el).toBeInTheDocument();
    expect(el.className).toContain("dc-text");
    expect(el.className).toContain("dc-text--muted");
    expect(el.className).toContain("dc-text--italic");
  });
});
