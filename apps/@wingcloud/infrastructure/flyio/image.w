bring util;
bring "@cdktf/provider-docker" as docker;
bring "@cdktf/provider-null" as nullProvider;

struct DockerImageProps {
  build: docker.image.ImageBuild;
  name: str;
  org: str;
}

pub class DockerImage {
  pub imageName: str;
  init(props: DockerImageProps) {
    new docker.provider.DockerProvider();
    new nullProvider.provider.NullProvider();

    let image = new docker.image.Image(
      name: "registry.fly.io/wing-cloud-image-${props.name}:${util.nanoid(alphabet: "0123456789abcdefghijklmnopqrstuvwxyz", size: 10)}",
      buildAttribute: props.build,
    );

    let resource = new nullProvider.resource.Resource(triggers: { "changed": util.nanoid() }) as "create image";
    resource.addOverride("provisioner.local-exec.command", "
fly status -a wing-cloud-image-${props.name} || flyctl launch --copy-config --no-deploy --name wing-cloud-image-${props.name} -o ${props.org} -r iad -y
fly auth docker
docker push ${image.name}
    ");
    let destroy = new nullProvider.resource.Resource() as "delete image";
    destroy.addOverride("provisioner.local-exec.when", "destroy");
    destroy.addOverride("provisioner.local-exec.command", "
fly status -a wing-cloud-image-${props.name} && flyctl apps destroy wing-cloud-image-${props.name} -y
");

    this.imageName = image.name;
  }
}
