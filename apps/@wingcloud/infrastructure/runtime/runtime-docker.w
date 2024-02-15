bring "../flyio/image.w" as flyioImage;

struct RuntimeDockerImageProps {
  flyOrgSlug: str;
}

pub class RuntimeDockerImage {
  extern "../src/get-runtime-project-path.cjs" static getRuntimeProjectPath(obj: std.IResource): str;

  pub image: flyioImage.DockerImage;
  new(props: RuntimeDockerImageProps) {
    this.image = new flyioImage.DockerImage(name: "runtime-environment", org: props.flyOrgSlug, build: {
      context: RuntimeDockerImage.getRuntimeProjectPath(this),
      platform: "linux/amd64"
    }) as "runtime-environment-image";
  }
}
