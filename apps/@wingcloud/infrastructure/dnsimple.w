bring util;
bring cloud;
bring "constructs" as constructs;
bring "@cdktf/provider-aws" as aws;
bring "@cdktf/provider-dnsimple" as dnsimple;

struct DNSRecordProps {
  zoneName: str;
  subDomain: str;
  recordType: str;
  ttl: num;
  distributionUrl: str;
}

class Dummy {}

class Once {
  new(uid: str, block: (): void) {
    let root = std.Node.of(this).root;
    let exists = root.tryFindChild(uid);
    if exists? {
      return this;
    }
    new Dummy() as uid in Once.toResource(root);
    block();
  }

  // this is an ugly hack
  // the path to the utils should be relative to the .main.w file!!!!!
  extern "./util.js" static toResource(o: constructs.IConstruct): Dummy;
}

class DNSimpleProvider {
  new() {
    if util.env("WING_TARGET") != "tf-aws" {
      return this;
    }

    new Once("dnsimple-provider-ca10e5cc", () => {
      new dnsimple.provider.DnsimpleProvider();
    });
  }
}

pub class DNSimpleZoneRecord {
  pub record: dnsimple.zoneRecord.ZoneRecord;

  new(props: DNSRecordProps) {
    new DNSimpleProvider();
    this.record = new dnsimple.zoneRecord.ZoneRecord(
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
  pub certificate: aws.acmCertificate.AcmCertificate;

  new(props: CertificateProps) {
    this.certificate = new aws.acmCertificate.AcmCertificate(
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
pub class DNSimpleValidatedCertificate {
  pub certificate: Certificate;

  new(props: DNSimpleValidateCertificateProps) {
    this.certificate = new Certificate(domainName: "{props.subDomain}.{props.zoneName}");
    let dnsRecord = new DNSimpleZoneRecord(
      subDomain: "replaced",
      recordType: "$\{each.value.type}",
      distributionUrl: "replaced",
      ttl: 60,
      zoneName: props.zoneName
    ) as "{props.zoneName}.dnsimple.zoneRecord.ZoneRecord";

    dnsRecord.record.addOverride("name", "$\{replace(each.value.name, \".{props.zoneName}.\", \"\")}");
    dnsRecord.record.addOverride("value", "$\{replace(each.value.record, \"acm-validations.aws.\", \"acm-validations.aws\")}");
    dnsRecord.record.addOverride("for_each", "$\{\{
        for dvo in {this.certificate.certificate.fqn}.domain_validation_options : dvo.domain_name => \{
          name   = dvo.resource_record_name
          record = dvo.resource_record_value
          type   = dvo.resource_record_type
        }
      }
    }");

    let certValidation = new aws.acmCertificateValidation.AcmCertificateValidation(
      certificateArn: this.certificate.certificate.arn
    )as "{props.zoneName}.aws.acmCertificateValidation.AcmCertificateValidation";

    certValidation.addOverride("validation_record_fqdns", "$\{[for record in {dnsRecord.record.fqn} : record.qualified_name]}");
  }
}
