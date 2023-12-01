pub class HttpError {
  pub static inflight badRequest(message: str?): str {
    return Json.stringify({
      code: 400,
      message: message ?? "Bad request",
    });
  }

  pub static inflight unauthorized(message: str?): str {
    return Json.stringify({
      code: 401,
      message: message ?? "Unauthorized",
    });
  }

  pub static inflight forbidden(message: str?): str {
    return Json.stringify({
      code: 403,
      message: message ?? "Forbidden",
    });
  }

  pub static inflight notFound(message: str?): str {
    return Json.stringify({
      code: 404,
      message: message ?? "Not found",
    });
  }

  pub static inflight error(message: str?): str {
    return Json.stringify({
      code: 500,
      message: message,
    });
  }
}
