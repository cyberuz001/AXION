import assert from "node:assert/strict";
import test from "node:test";
import { applyCommand, publicTournaments } from "../src/lib/tournaments.ts";

function startCup() {
  const teams = ["Nova", "Pulse", "Nexus", "Qalqon"].map((name, index) => ({
    id: `team-${index}`, name, captain: `Demo captain ${index}`,
  }));
  const cup = {
    id: "cup", title: "AXION Demo Cup", game: "cs2", status: "open",
    date: "2026-12-12T13:00:00.000Z", slots: 4, prize: 0, teams, matches: [],
  };
  return applyCommand([cup], { kind: "start", id: "cup" }, "unused");
}

test("semifinal winners advance and the final completes the tournament", () => {
  const score = (state, match, a, b) => applyCommand(state, { kind: "score", id: "cup", match, a, b }, "unused");
  let cup = startCup();
  cup = score(cup, "r1-m1", 13, 8);
  cup = score(cup, "r1-m2", 5, 13);
  const final = cup[0].matches.find(({ id }) => id === "r2-m1");
  assert.deepEqual([final.a, final.b], ["team-0", "team-2"]);

  cup = score(cup, "r2-m1", 13, 11);
  assert.equal(cup[0].status, "completed");
  assert.equal(cup[0].matches.find(({ id }) => id === "r2-m1").winner, "team-0");
});

test("the public tournament data omits captain details", () => {
  const [cup] = publicTournaments(startCup());
  assert.deepEqual(cup.teams[0], { id: "team-0", name: "Nova" });
});
