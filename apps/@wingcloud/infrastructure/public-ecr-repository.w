bring util;
bring cloud;
bring "constructs" as constructs;
bring "@cdktf/provider-aws" as aws;
bring "@cdktf/provider-docker" as docker;
bring "@cdktf/provider-null" as nullProvider;
bring "cdktf" as cdktf;

class DockerProvider {
  init(props: docker.provider.DockerProviderConfig) {
    if util.env("WING_TARGET") != "tf-aws" {
      return this;
    }

    new docker.provider.DockerProvider(registryAuth: props.registryAuth);
  }
}

struct PublicECRRepositoryProps {
  name: str;
}

class PublicECRRepository {
  pub ecrRepo: aws.ecrpublicRepository.EcrpublicRepository;
  pub authToken: aws.dataAwsEcrpublicAuthorizationToken.DataAwsEcrpublicAuthorizationToken;
  init(props: PublicECRRepositoryProps) {
    this.ecrRepo = new aws.ecrpublicRepository.EcrpublicRepository(repositoryName: props.name, catalogData: {
      architectures: ["x86-64"],
      operatingSystems: ["Linux"]
    });
    this.authToken = new aws.dataAwsEcrpublicAuthorizationToken.DataAwsEcrpublicAuthorizationToken();
  }
}

struct DockerImageProps {
  repo: PublicECRRepository;
  build: docker.image.ImageBuild;
}

class DockerImage {
  pub imageName: str;
  init(props: DockerImageProps) {
    new DockerProvider(registryAuth: {
      address: "public.ecr.aws",
      username: props.repo.authToken.userName,
      password: props.repo.authToken.password
    });
    new nullProvider.provider.NullProvider();

    let image = new docker.image.Image(
      name: "${props.repo.ecrRepo.repositoryUri}:${util.nanoid(alphabet: "0123456789abcdefghijklmnopqrstuvwxyz", size: 10)}",
      buildAttribute: props.build,
    );
    
    let resource = new nullProvider.resource.Resource(triggers: { "changed": util.nanoid() });
    resource.addOverride("provisioner.local-exec.command", "
echo ${props.repo.authToken.password} | docker login --username AWS --password-stdin public.ecr.aws
docker push ${image.name}
docker manifest create --amend ${image.name} ${image.name}
docker manifest push ${image.name}
    ");

    this.imageName = image.name;
  }
}