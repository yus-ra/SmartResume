import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

class MemoryStorage {
  values = new Map();

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }

  clear() {
    this.values.clear();
  }
}

const storage = new MemoryStorage();
globalThis.window = { localStorage: storage };

const {
  getResumeSyncState,
  resetResumeSyncState,
  saveResume,
  setResumeScope,
  syncResumeFromServer,
  syncResumeToServer,
} = await import("../src/lib/resumeSchema.js");

const originalFetch = globalThis.fetch;

const makeResume = (name) => ({
  contact: { name },
  summary: `Resume belonging to ${name}`,
  experience: [],
  education: [],
  skills: [],
});

const jsonResponse = (payload) => ({
  ok: true,
  status: 200,
  json: async () => payload,
});

const deferred = () => {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

const storageSnapshot = (keys) =>
  Object.fromEntries(keys.map((key) => [key, storage.getItem(key)]));

const allStorageSnapshot = () => Object.fromEntries(storage.values.entries());

beforeEach(() => {
  setResumeScope(null);
  storage.clear();
  // Keep legacy anonymous data in its own namespace while tests switch scopes.
  storage.setItem("smartresume_resume_migration_v1", "quarantined");
  resetResumeSyncState();
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("discards Account A pull after Account B becomes active", async () => {
  setResumeScope("account-a");
  saveResume(makeResume("Account A"));

  const request = deferred();
  let requestCount = 0;
  globalThis.fetch = () => {
    requestCount += 1;
    return request.promise;
  };

  const pendingPull = syncResumeFromServer();
  assert.equal(requestCount, 1);

  setResumeScope("account-b");
  saveResume(makeResume("Account B"));

  const accountBKeys = [
    "resumeData:uaccount-b",
    "cvData:uaccount-b",
    "smartresume_local_updated_at:uaccount-b",
  ];
  const accountBBefore = storageSnapshot(accountBKeys);
  const allStorageBefore = allStorageSnapshot();
  const syncStateBefore = getResumeSyncState();

  request.resolve(
    jsonResponse({
      resume: makeResume("Account A remote"),
      updatedAt: "2999-01-01T00:00:00.000Z",
    }),
  );

  assert.deepEqual(await pendingPull, {
    ok: false,
    reason: "obsolete",
    changed: false,
  });
  assert.deepEqual(storageSnapshot(accountBKeys), accountBBefore);
  assert.deepEqual(allStorageSnapshot(), allStorageBefore);
  assert.deepEqual(getResumeSyncState(), syncStateBefore);
  assert.equal(requestCount, 1);
});

test("discards Account A pull after logout instead of writing anonymous keys", async () => {
  storage.setItem("resumeData", JSON.stringify(makeResume("Anonymous")));
  storage.setItem("cvData", "anonymous legacy value");
  storage.setItem("smartresume_local_updated_at", "123");

  setResumeScope("account-a");
  saveResume(makeResume("Account A"));

  const request = deferred();
  globalThis.fetch = () => request.promise;
  const pendingPull = syncResumeFromServer();

  setResumeScope(null);
  const anonymousKeys = [
    "resumeData",
    "cvData",
    "smartresume_local_updated_at",
  ];
  const anonymousBefore = storageSnapshot(anonymousKeys);
  const allStorageBefore = allStorageSnapshot();
  const syncStateBefore = getResumeSyncState();

  request.resolve(
    jsonResponse({
      resume: makeResume("Account A remote"),
      updatedAt: "2999-01-01T00:00:00.000Z",
    }),
  );

  assert.deepEqual(await pendingPull, {
    ok: false,
    reason: "obsolete",
    changed: false,
  });
  assert.deepEqual(storageSnapshot(anonymousKeys), anonymousBefore);
  assert.deepEqual(allStorageSnapshot(), allStorageBefore);
  assert.deepEqual(getResumeSyncState(), syncStateBefore);
});

test("logout and login to the same account invalidates the prior session pull", async () => {
  setResumeScope("account-a");
  saveResume(makeResume("Account A old local"));

  const request = deferred();
  globalThis.fetch = () => request.promise;
  const pendingPull = syncResumeFromServer();

  setResumeScope(null);
  setResumeScope("account-a");
  saveResume(makeResume("Account A current session"));

  const accountAKeys = [
    "resumeData:uaccount-a",
    "cvData:uaccount-a",
    "smartresume_local_updated_at:uaccount-a",
  ];
  const accountABefore = storageSnapshot(accountAKeys);
  const allStorageBefore = allStorageSnapshot();
  const syncStateBefore = getResumeSyncState();

  request.resolve(
    jsonResponse({
      resume: makeResume("Account A stale response"),
      updatedAt: "2999-01-01T00:00:00.000Z",
    }),
  );

  assert.deepEqual(await pendingPull, {
    ok: false,
    reason: "obsolete",
    changed: false,
  });
  assert.deepEqual(storageSnapshot(accountAKeys), accountABefore);
  assert.deepEqual(allStorageSnapshot(), allStorageBefore);
  assert.deepEqual(getResumeSyncState(), syncStateBefore);
});

test("discards Account A push response after Account B becomes active", async () => {
  setResumeScope("account-a");
  const accountA = saveResume(makeResume("Account A"));

  const request = deferred();
  globalThis.fetch = () => request.promise;
  const pendingPush = syncResumeToServer(accountA.resume);

  setResumeScope("account-b");
  saveResume(makeResume("Account B"));

  const accountBKeys = [
    "resumeData:uaccount-b",
    "cvData:uaccount-b",
    "smartresume_local_updated_at:uaccount-b",
  ];
  const accountBBefore = storageSnapshot(accountBKeys);
  const allStorageBefore = allStorageSnapshot();
  const syncStateBefore = getResumeSyncState();

  request.resolve(jsonResponse({ resume: accountA.resume }));

  assert.deepEqual(await pendingPush, {
    ok: false,
    reason: "obsolete",
    changed: false,
  });
  assert.deepEqual(storageSnapshot(accountBKeys), accountBBefore);
  assert.deepEqual(allStorageSnapshot(), allStorageBefore);
  assert.deepEqual(getResumeSyncState(), syncStateBefore);
});
