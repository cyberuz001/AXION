import assert from "node:assert/strict";
import test from "node:test";
import { applyCommand, readCommand, TournamentError } from "../src/lib/tournaments.ts";

function openTournament() {
  return applyCommand([], {
    kind: "create", title: "AXION Demo Cup", game: "cs2",
    date: "2026-12-12T13:00:00.000Z", slots: 4, prize: 0,
  }, "cup");
}

test("T01: a new team is registered exactly once", () => {
  const before = openTournament();
  const join = readCommand({ kind: "join", id: "cup", name: "  Nova   Five ", captain: "Demo Captain" });
  const after = applyCommand(before, join, "team-nova");

  assert.deepEqual(after[0].teams, [{ id: "team-nova", name: "Nova Five", captain: "Demo Captain" }]);
  assert.deepEqual(before[0].teams, []);
});

test("T02: a duplicate team is rejected without changing the roster", () => {
  const join = readCommand({ kind: "join", id: "cup", name: "Nova Five", captain: "Demo Captain" });
  const registered = applyCommand(openTournament(), join, "team-nova");
  const snapshot = structuredClone(registered);

  assert.throws(
    () => applyCommand(registered, { ...join, name: "  ＮＯＶＡ   FIVE  " }, "team-duplicate"),
    (error) => error instanceof TournamentError && error.message === "Bu jamoa allaqachon ro‘yxatdan o‘tgan.",
  );
  assert.deepEqual(registered, snapshot);
});

test("compatibility normalization also collapses spaces introduced by Unicode", () => {
  const join = { kind: "join", id: "cup", name: "AXION ¨", captain: "Demo Captain" };
  const registered = applyCommand(openTournament(), join, "team-axion");
  assert.throws(() => applyCommand(registered, { ...join, name: "AXION \u0308" }, "duplicate"), TournamentError);
});
