bring util;
bring "@cdktf/provider-docker" as docker;
bring "@cdktf/provider-null" as nullProvider;
bring "@cdktf/provider-random" as randomProvider;

struct DockerImageProps {
  build: docker.image.ImageBuild;
  name: str;
  org: str;
}

pub class DockerImage {
  pub imageName: str;
  new(props: DockerImageProps) {
    new docker.provider.DockerProvider();
    new nullProvider.provider.NullProvider();
    new randomProvider.provider.RandomProvider();

    let randomString = new randomProvider.stringResource.StringResource(
      length: 10,
      special: false,
      upper: false,
      numeric: true,
    );

    let appName = "wing-cloud-image-do-not-delete-{props.name}-{randomString.result}";

    let image = new docker.image.Image(
      name: "registry.fly.io/{appName}:{util.nanoid(alphabet: "0123456789abcdefghijklmnopqrstuvwxyz", size: 10)}",
      buildAttribute: props.build,
    );

    let resource = new nullProvider.resource.Resource(triggers: { "changed": util.nanoid() }) as "create image";
    resource.addOverride("provisioner.local-exec.environment", {"FLY_APP_NAME": appName});
    resource.addOverride("provisioner.local-exec.command", "
flyctl status -a $FLY_APP_NAME || flyctl launch --copy-config --no-deploy --name $FLY_APP_NAME -o {props.org} -r iad -y
flyctl auth docker
docker push {image.name}
    ");

    // FIXME: We'll have to find another way to do this. Can't reference other resources here. Also, there are drawbacks
    // see https://developer.hashicorp.com/terraform/language/resources/provisioners/syntax#destroy-time-provisioners
    //
    // let destroy = new nullProvider.resource.Resource() as "delete image";
    // destroy.addOverride("provisioner.local-exec.when", "destroy");
    // destroy.addOverride("provisioner.local-exec.environment", {"FLY_APP_NAME": appName});
    // destroy.addOverride("provisioner.local-exec.command", "flyctl status -a $FLY_APP_NAME && flyctl apps destroy $FLY_APP_NAME -y");

    this.imageName = image.name;
  }
}
