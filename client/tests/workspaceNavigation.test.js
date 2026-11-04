import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isWorkspaceNavigationItemActive,
  workspaceNavigationItems,
} from "../src/components/Navbar/workspaceNavigation.js";

test("workspace navigation keeps the five intended destinations in order", () => {
  assert.deepEqual(
    workspaceNavigationItems.map(({ label, to }) => [label, to]),
    [
      ["Dashboard", "/dashboard"],
      ["Resume Editor", "/editor"],
      ["AI Analysis", "/analysis"],
      ["Job Match", "/job-match"],
      ["Portfolio", "/portfolio"],
    ],
  );
  assert.equal(workspaceNavigationItems.some(({ to }) => to === "/settings"), false);
});

test("navigation marks workspace destinations and their relevant subroutes active", () => {
  assert.equal(isWorkspaceNavigationItemActive("/dashboard", "/dashboard"), true);
  assert.equal(isWorkspaceNavigationItemActive("/editor", "/import-resume"), false);
  assert.equal(
    isWorkspaceNavigationItemActive("/editor", "/import-resume", {
      includeRelatedRoutes: true,
    }),
    true,
  );
  assert.equal(
    isWorkspaceNavigationItemActive("/job-match", "/job-match/results"),
    true,
  );
  assert.equal(isWorkspaceNavigationItemActive("/portfolio", "/settings"), false);
  assert.equal(isWorkspaceNavigationItemActive("/analysis", "/analysis"), true);
});
