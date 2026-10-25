import assert from "node:assert/strict";
import { test } from "node:test";
import mongoose from "mongoose";

import { createApp } from "../src/app.js";
import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { User } from "../src/models/User.js";
import authRoutes from "../src/routes/auth.routes.js";

test("async auth failures return a generic response and do not log details", async (t) => {
  const internalFailure = "internal-auth-failure-sentinel";
  const logs = [];
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };
  console.log = (...args) => logs.push(args.map(String).join(" "));
  console.warn = (...args) => logs.push(args.map(String).join(" "));
  console.error = (...args) => logs.push(args.map(String).join(" "));

  const restoreConsole = () => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  };

  t.after(restoreConsole);
  t.mock.method(mongoose, "connect", async () => mongoose);
  t.mock.method(mongoose, "disconnect", async () => mongoose);
  t.mock.method(User, "findOne", async () => {
    throw new Error(internalFailure);
  });

  try {
    await connectDatabase();

    const app = createApp();
    const errorMiddleware = app._router.stack.find(
      (layer) => layer.handle.length === 4,
    )?.handle;
    assert.equal(typeof errorMiddleware, "function");

    for (const [path, method] of [
      ["/register", "post"],
      ["/login", "post"],
      ["/forgot-password", "post"],
      ["/reset-password", "post"],
      ["/me", "patch"],
    ]) {
      const route = authRoutes.stack.find(
        (layer) => layer.route?.path === path && layer.route.methods[method],
      );
      assert.equal(route?.route.stack.at(-1).handle.name, "asyncHandlerMiddleware");
    }

    const registerRoute = authRoutes.stack.find(
      (layer) => layer.route?.path === "/register" && layer.route.methods.post,
    );
    const handler = registerRoute.route.stack.at(-1).handle;
    const req = {
      body: {
        firstName: "Test",
        surname: "User",
        email: "async-error@example.test",
        password: "test-only-password",
      },
    };
    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };

    await handler(req, res, (error) =>
      errorMiddleware(error, req, res, () => {}),
    );

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
      error: "internal_error",
      message: "Something went wrong on the server.",
    });

    const logOutput = logs.join("\n");
    assert.equal(logOutput.includes(internalFailure), false);
    assert.equal(logOutput.includes("async-error@example.test"), false);
    assert.equal(logOutput.includes("test-only-password"), false);
  } finally {
    await disconnectDatabase();
    restoreConsole();
  }
});
