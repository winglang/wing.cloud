import { type AppProps } from "@winglang/sdk/lib/core";
import { Node } from "@winglang/sdk/lib/std";
import * as tfaws from "@winglang/sdk/lib/target-tf-aws";

export class App extends tfaws.App {
  constructor(props: AppProps) {
    super(props);
  }

  /**
   * Override the default behavior of synthRoots for testing
   * to allow for a single root construct, rather than one per
   * test.
   *
   * https://github.com/winglang/wing/blob/main/libs/wingsdk/src/core/app.ts
   *
   * @param props The App props
   */
  protected synthRoots(props: AppProps) {
    if (props.rootConstruct) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const Root = props.rootConstruct;
      // mark the root type so that we can find it later through
      // Node.of(root).root
      Node._markRoot(Root);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      new Root(this, "Default");
    }
  }
}
