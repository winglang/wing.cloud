bring ex;
bring util;

pub class ReactAppPatch {
  // Configure the CloudFront Distribution to fallback to `/apps/index.html`.
  // Change the default TTL for the CloudFront Distribution to 0.
  // Make sure only assets are cached.
  pub static apply(reactApp: ex.ReactApp) {
    if util.env("WING_TARGET") != "tf-aws" {
      return;
    }

    let distribution = unsafeCast(std.Node.of(reactApp).children.at(0).node.findChild("Distribution"));

    // Fallback to `/index.html`.
    distribution?.addOverride("custom_error_response", [
      {
        error_code: 403,
        response_code: 200,
        response_page_path: "/index.html",
      },
    ]);

    // Set a short default TTL.
    distribution?.addOverride("default_cache_behavior.default_ttl", 1m.seconds);
    distribution?.addOverride("default_cache_behavior.min_ttl", 1m.seconds);

    // Cache assets forever.
    distribution?.addOverride("ordered_cache_behavior", {
      path_pattern: "/assets/*",
      allowed_methods: ["GET", "HEAD"],
      cached_methods: ["GET", "HEAD"],
      target_origin_id: "s3Origin",
      // See https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html#managed-cache-caching-optimized.
      cache_policy_id: "658327ea-f89d-4fab-a63d-7e88639e58f6",
      min_ttl: 1y.seconds,
      default_ttl: 1y.seconds,
      max_ttl: 1y.seconds,
      compress: true,
      viewer_protocol_policy: "redirect-to-https",
    });
  }
}
