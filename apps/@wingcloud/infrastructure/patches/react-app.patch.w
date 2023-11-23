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

    // distribution?.addOverride("custom_error_response", [
    //   {
    //     error_code: 403,
    //     response_code: 200,
    //     response_page_path: "/apps/index.html",
    //   },
    // ]);

    distribution?.addOverride("origin_group", {
      origin_id: "website_group",
      failover_criteria: {
        status_codes: [404],
      },
      member: [
        {
          origin_id: "landingPage",
        },
        {
          origin_id: "s3Origin",
        },
      ],
    });
    distribution?.addOverride("default_cache_behavior.target_origin_id", "website_group");

    // set default TTL to 0
    distribution?.addOverride("default_cache_behavior.default_ttl", 0);
    distribution?.addOverride("default_cache_behavior.min_ttl", 0);

    // make sure only assets are cached
    distribution?.addOverride("ordered_cache_behavior", {
      "path_pattern": "apps/assets/*",
      "allowed_methods": ["GET", "HEAD"],
      "cached_methods": ["GET", "HEAD"],
      "target_origin_id" : "s3Origin",
      "forwarded_values": {
        "query_string": false,
        "cookies": {
          "forward": "none",
        },
      },
      "min_ttl": 1y.seconds,
      "default_ttl": 1y.seconds,
      "max_ttl": 1y.seconds,
      "compress": true,
      "viewer_protocol_policy": "redirect-to-https",
    });
  }
}

// bring "@cdktf/provider-aws" as aws;

// new aws.cloudfrontDistribution.CloudfrontDistribution(
//   origin: [],
//   originGroup: [],
//   orderedCacheBehavior: [],
// );
