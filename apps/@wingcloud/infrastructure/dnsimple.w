bring util;
bring cloud;
bring "constructs" as constructs;
bring "cdktf" as cdktf;
bring "@cdktf/provider-aws" as awsProvider;
bring "@cdktf/provider-dnsimple" as dnsimpleProvider;

struct DNSRecordProps {
  zoneName: str;
  subDomain: str;
  recordType: str;
  ttl: num;
  distributionUrl: str;
}

class Dummy {}

class DNSimpleProvider {
  init() {
    if util.env("WING_TARGET") != "tf-aws" {
      return this;
    }
    
    let uid = "dnsimple-provider-CA10E5CC-36D7-412A-B4FC-1C98AF521569";
    let root = std.Node.of(this).root;
    let exists = root.node.tryFindChild(uid);
    if exists? { return this; }
    new Dummy() as uid in DNSimpleProvider.toResource(root);

    let DNSIMPLE_TOKEN = new cdktf.TerraformVariable({ type: "string" }) as "DNSIMPLE_TOKEN";
    let DNSIMPLE_ACCOUNT = new cdktf.TerraformVariable({ type: "string" }) as "DNSIMPLE_ACCOUNT";

    new dnsimpleProvider.provider.DnsimpleProvider(
      token: "${DNSIMPLE_TOKEN}",
      account: "${DNSIMPLE_ACCOUNT}"
    );
  }

  // this is an ugly hack
  // the path to the utils should be relative to the .main.w file!!!!!
  extern "./util.js" static toResource(o: constructs.IConstruct): Dummy;
}

class DNSimpleZoneRecord {
  pub record: dnsimpleProvider.zoneRecord.ZoneRecord;

  init(props: DNSRecordProps) {
    new DNSimpleProvider();
    this.record = new dnsimpleProvider.zoneRecord.ZoneRecord(
      zoneName: props.zoneName,
      name: props.subDomain, // For the root domain, use an empty string. For subdomains, use the subdomain part (like 'www' for 'www.yourdomain.com')
      value: props.distributionUrl, // This a CloudFront URL. CloudFront distribution domain or any other target.
      type: props.recordType,
      ttl: props.ttl
    );
  }
}

struct CertificateProps {
  domainName: str;
}

class Certificate {
  pub certificate: awsProvider.acmCertificate.AcmCertificate;

  init(props: CertificateProps) {
    this.certificate = new awsProvider.acmCertificate.AcmCertificate(
      domainName: props.domainName,
      validationMethod: "DNS",
      lifecycle: {
       createBeforeDestroy: true,
      }
    );
  }
}

struct DNSimpleValidateCertificateProps {
  zoneName: str;
  subDomain: str;
}

// this class introduces some strange workarounds for validating a certificate
// see https://github.com/hashicorp/terraform-cdk/issues/2178
class DNSimpleValidatedCertificate {
  pub certificate: Certificate;

  init(props: DNSimpleValidateCertificateProps) {
    this.certificate = new Certificate(domainName: "${props.subDomain}.${props.zoneName}");
    let dnsRecord = new DNSimpleZoneRecord(
      subDomain: "replaced",
      recordType: "\${each.value.type}",
      distributionUrl: "replaced",
      ttl: 60,
      zoneName: props.zoneName
    ) as "${props.zoneName}.dnsimple.zoneRecord.ZoneRecord";

    dnsRecord.record.addOverride("name", "\${replace(each.value.name, \".${props.zoneName}.\", \"\")}");
    dnsRecord.record.addOverride("value", "\${replace(each.value.record, \"acm-validations.aws.\", \"acm-validations.aws\")}");
    dnsRecord.record.addOverride("for_each", "\${{
        for dvo in ${this.certificate.certificate.fqn}.domain_validation_options : dvo.domain_name => {
          name   = dvo.resource_record_name
          record = dvo.resource_record_value
          type   = dvo.resource_record_type
        }
      }
    }");

    let certValidation = new awsProvider.acmCertificateValidation.AcmCertificateValidation(
      certificateArn: this.certificate.certificate.arn
    )as "${props.zoneName}.aws.acmCertificateValidation.AcmCertificateValidation";

    certValidation.addOverride("validation_record_fqdns", "\${[for record in ${dnsRecord.record.fqn} : record.qualified_name]}");
  }
}
