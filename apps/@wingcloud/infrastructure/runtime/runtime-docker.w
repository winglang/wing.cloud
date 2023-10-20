bring "../public-ecr-repository.w" as publicEcrRepository;

pub class RuntimeDockerImage {
  extern "../src/get-runtime-project-path.cjs" static getRuntimeProjectPath(obj: std.IResource): str;

  pub image: publicEcrRepository.DockerImage;
  init() {
    let repo = new publicEcrRepository.PublicECRRepository(name: "runtime-environment");
    this.image = new publicEcrRepository.DockerImage(repo: repo, build: {
      context: RuntimeDockerImage.getRuntimeProjectPath(this),
      platform: "linux/amd64"
    });
  }
}
