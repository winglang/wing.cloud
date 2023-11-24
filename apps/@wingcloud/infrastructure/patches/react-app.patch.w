bring ex;
bring util;

pub class ReactAppPatch {

    // Configure the CloudFront Distribution to fallback to `/apps/index.html`.
    // Change the default TTL for the CloudFront Distribution to 0.
    // Make sure only assets are cached.
    pub static apply(reactApp: ex.ReactApp) {
        if util.env("WING_TARGET") == "tf-aws" {
            let distributionNode = unsafeCast(std.Node.of(reactApp).children.at(0).node.findChild("Distribution"));
            distributionNode?.addOverride("custom_error_response", [
            {
                error_code: 403,
                response_code: 200,
                response_page_path: "/apps/index.html",
            },
            ]);
            // set default TTL to 0
            distributionNode?.addOverride("default_cache_behavior.default_ttl", 0);
            distributionNode?.addOverride("default_cache_behavior.min_ttl", 0);

            // make sure only assets are cached
            distributionNode?.addOverride("ordered_cache_behavior", {
            "path_pattern": "apps/assets/*",
            "allowed_methods": ["GET", "HEAD"],
            "cached_methods": ["GET", "HEAD"],
            "target_origin_id" : "s3Origin",
            "forwarded_values": {
                "query_string": false,
                "cookies": {
                "forward": "none"
                }
            },
            "min_ttl": 31536000, //365 days
            "default_ttl": 31536000,
            "max_ttl": 31536000,
            "compress": true,
            "viewer_protocol_policy":"redirect-to-https"
            });
        }
    }
}
