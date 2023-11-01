bring "../flyio/image.w" as flyioImage;

pub class RuntimeDockerImage {
  extern "../src/get-runtime-project-path.cjs" static getRuntimeProjectPath(obj: std.IResource): str;

  pub image: flyioImage.DockerImage;
  init() {
    this.image = new flyioImage.DockerImage(name: "runtime-environment", build: {
      context: RuntimeDockerImage.getRuntimeProjectPath(this),
      platform: "linux/amd64"
    });
  }
}
