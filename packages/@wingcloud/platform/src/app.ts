import { Node } from '@winglang/sdk/lib/std';
import * as tfaws from '@winglang/sdk/lib/target-tf-aws';
import { type AppProps } from '@winglang/sdk/lib/core';
import type { TestRunner } from '@winglang/sdk/lib/std';

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
 * @param testRunner The test runner
 */
  protected synthRoots(props: AppProps, testRunner: TestRunner) {
    if (props.rootConstruct) {
      const Root = props.rootConstruct;
      // mark the root type so that we can find it later through
      // Node.of(root).root
      Node._markRoot(Root);

      new Root(this, "Default");
    }
  }
}
