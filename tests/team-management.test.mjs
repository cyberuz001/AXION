import assert from "node:assert/strict";
import test from "node:test";
import { applyCommand, demoTournaments, readCommand, TournamentError } from "../src/lib/tournaments.ts";

const major = { id: "axion-major", teamId: "team-1", previousName: "UzCore", previousCaptain: "" };

test("editing preserves the team ID and existing bracket references", () => {
  const items = demoTournaments();
  const before = items.find((cup) => cup.id === "midnight-cup");
  const command = readCommand({ kind: "edit-team", id: before.id, teamId: "team-1", previousName: "Nexus", previousCaptain: "",
    name: "  Nexus   Prime  ", captain: " Captain Nick " });
  const after = applyCommand(items, command, "unused").find((cup) => cup.id === before.id);

  assert.deepEqual(after.teams[0], { id: "team-1", name: "Nexus Prime", captain: "Captain Nick" });
  assert.deepEqual(after.matches, before.matches);
  assert.equal(before.teams[0].name, "Nexus");
  assert.throws(() => applyCommand(items, { ...command, name: " QALQON " }, "unused"), TournamentError);
  const cleared = applyCommand([after], { ...command, previousName: "Nexus Prime", previousCaptain: "Captain Nick", captain: "" }, "unused");
  assert.equal(cleared[0].teams[0].captain, undefined);
});

test("removing a team frees its slot before the tournament starts", () => {
  const cup = demoTournaments()[0];
  const filled = { ...cup, slots: cup.teams.length };
  const command = readCommand({ kind: "delete-team", ...major });
  const changed = applyCommand([filled], command, "unused");
  assert.deepEqual(changed[0].teams, cup.teams.slice(1));
  assert.deepEqual(changed[0].matches, []);
  const joined = applyCommand(changed, { kind: "join", id: cup.id, name: "Replacement", captain: "Captain Nick" }, "team-new");
  assert.equal(joined[0].teams.length, filled.slots);
  assert.throws(() => applyCommand(changed, command, "unused"), TournamentError);
});

test("stale roster changes and removals after start are rejected", () => {
  const items = demoTournaments();
  const edit = readCommand({ kind: "edit-team", ...major, name: "UzCore", captain: "New Nick" });
  const edited = applyCommand(items, edit, "unused");
  assert.throws(() => applyCommand(edited, { kind: "delete-team", ...major }, "unused"), /Jamoa ma’lumotlari o‘zgargan/);
  assert.throws(() => applyCommand(edited, { ...edit, name: "Stale Name" }, "unused"), /Jamoa ma’lumotlari o‘zgargan/);
  const started = applyCommand(items, { kind: "start", id: major.id }, "unused");
  assert.throws(() => applyCommand(started, { kind: "delete-team", ...major }, "unused"), /Turnir boshlangach/);
  assert.throws(() => readCommand({ kind: "delete-team", id: major.id, teamId: major.teamId }), TournamentError);
});
