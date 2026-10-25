/** Forward rejected async route-handler promises to Express 4 error middleware. */
export function asyncHandler(handler) {
  return function asyncHandlerMiddleware(req, res, next) {
    return Promise.resolve()
      .then(() => handler(req, res, next))
      .catch(next);
  };
}
