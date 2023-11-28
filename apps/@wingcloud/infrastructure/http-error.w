pub class HttpError {
  pub static inflight throwBadRequest(message: str?): str {
    return Json.stringify({
      code: 400,
      message: message ?? "Bad request",
    });
  }

  pub static inflight throwUnauthorized(message: str?): str {
    return Json.stringify({
      code: 401,
      message: message ?? "Unauthorized",
    });
  }

  pub static inflight throwForbidden(message: str?): str {
    return Json.stringify({
      code: 403,
      message: message ?? "Forbidden",
    });
  }

  pub static inflight throwNotFound(message: str?): str {
    return Json.stringify({
      code: 404,
      message: message ?? "Not found",
    });
  }

  pub static inflight throwError(message: str?): str {
    return Json.stringify({
      code: 500,
      message: message,
    });
  }
}
