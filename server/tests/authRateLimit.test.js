import assert from "node:assert/strict";
import { test } from "node:test";

import { createApp } from "../src/app.js";
import authRoutes from "../src/routes/auth.routes.js";

const secretSentinels = [
  "ratelimit-account@example.test",
  "login-password-sentinel",
  "reset-token-sentinel",
  "new-password-sentinel",
];

const endpointCases = [
  {
    path: "/login",
    max: 10,
    body: {
      email: secretSentinels[0],
      password: secretSentinels[1],
    },
  },
  {
    path: "/register",
    max: 5,
    body: {
      firstName: "Test",
      surname: "User",
      email: secretSentinels[0],
      password: secretSentinels[1],
    },
  },
  {
    path: "/forgot-password",
    max: 5,
    body: { email: secretSentinels[0] },
  },
  {
    path: "/reset-password",
    max: 10,
    body: {
      token: secretSentinels[2],
      password: secretSentinels[3],
    },
  },
];

const findPostRoute = (path) =>
  authRoutes.stack.find(
    (layer) => layer.route?.path === path && layer.route.methods.post,
  );

const invokePostRoute = async (path, body) => {
  const route = findPostRoute(path);
  assert.ok(route, `Expected POST ${path} route to exist`);

  const req = {
    body,
    ip: "192.0.2.44",
    socket: { remoteAddress: "192.0.2.44" },
  };
  const headers = {};
  const res = {
    statusCode: null,
    body: null,
    set(name, value) {
      headers[name.toLowerCase()] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  const [limiter, controller] = route.route.stack.map((layer) => layer.handle);
  let controllerResult;
  limiter(req, res, () => {
    controllerResult = controller(req, res, () => {});
  });

  if (controllerResult && typeof controllerResult.then === "function") {
    await controllerResult;
  }

  return { status: res.statusCode, body: res.body, headers };
};

test("authentication-sensitive endpoints have independent rate limits", async (t) => {
  const app = createApp();
  assert.equal(app.get("trust proxy"), 1);

  const logs = [];
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };
  console.log = (...args) => logs.push(args.map(String).join(" "));
  console.warn = (...args) => logs.push(args.map(String).join(" "));
  console.error = (...args) => logs.push(args.map(String).join(" "));

  const rateLimitBodies = [];

  try {
    for (const endpoint of endpointCases) {
      await t.test(`${endpoint.path} allows requests below its limit`, async () => {
        const allowed = await invokePostRoute(endpoint.path, endpoint.body);

        // MongoDB is not connected in this unit test. A valid request reaching
        // the existing controller therefore gets its normal 503 response.
        assert.equal(allowed.status, 503);
        assert.equal(allowed.body.error, "database_unavailable");
      });

      await t.test(`${endpoint.path} returns a generic 429 after its limit`, async () => {
        // The previous subtest consumed request one. Complete the remaining
        // allowed attempts before checking the first blocked request.
        for (let count = 1; count < endpoint.max; count += 1) {
          const allowed = await invokePostRoute(endpoint.path, endpoint.body);
          assert.equal(allowed.status, 503);
        }

        const limited = await invokePostRoute(endpoint.path, endpoint.body);
        assert.equal(limited.status, 429);
        assert.equal(limited.body.error, "rate_limited");
        assert.equal(
          limited.body.message,
          "Too many requests. Please try again later.",
        );
        assert.equal(Number(limited.headers["retry-after"]) > 0, true);

        const serialized = JSON.stringify(limited.body);
        rateLimitBodies.push(serialized);
        for (const sentinel of secretSentinels) {
          assert.equal(serialized.includes(sentinel), false);
        }
        assert.equal(serialized.toLowerCase().includes("account exists"), false);
      });
    }

    assert.equal(new Set(rateLimitBodies).size, 1);
    const logOutput = logs.join("\n");
    for (const sentinel of secretSentinels) {
      assert.equal(logOutput.includes(sentinel), false);
    }
  } finally {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  }
});

test("Render forwarded client IPs keep authentication limits isolated", async (t) => {
  const app = createApp();
  assert.equal(app.get("trust proxy"), 1);

  const route = findPostRoute("/register");
  const limiter = route.route.stack[0].handle;
  const forwardedClientIp = (ip) => {
    const req = Object.create(app.request);
    const socket = { remoteAddress: "10.0.0.8" };

    Object.defineProperties(req, {
      app: { value: app },
      headers: { value: { "x-forwarded-for": ip } },
      socket: { value: socket },
      connection: { value: socket },
    });

    return req.ip;
  };
  const runLimiter = (ip) => {
    const req = {
      ip: forwardedClientIp(ip),
      socket: { remoteAddress: "10.0.0.8" },
    };
    const res = {
      statusCode: null,
      headers: {},
      set(name, value) {
        this.headers[name.toLowerCase()] = value;
        return this;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };
    let passed = false;

    limiter(req, res, () => {
      passed = true;
    });

    return { passed, res };
  };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(forwardedClientIp("198.51.100.31"), "198.51.100.31");
    assert.equal(runLimiter("198.51.100.31").passed, true);
  }

  const limited = runLimiter("198.51.100.31");
  assert.equal(limited.passed, false);
  assert.equal(limited.res.statusCode, 429);

  assert.equal(forwardedClientIp("198.51.100.32"), "198.51.100.32");
  assert.equal(runLimiter("198.51.100.32").passed, true);
});
