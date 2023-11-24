import * as tfaws from '@winglang/sdk/lib/target-tf-aws';
import type { AppProps } from '@winglang/sdk/lib/core';
import type { TestRunner } from '@winglang/sdk/lib/std';

export class App extends tfaws.App {
  /**
 * Override the default behavior of synthRoots for testing
 * to allow for a single root construct, rather than one per
 * test.
 *
 * @param props The App props
 * @param testRunner The test runner
 */
  protected synthRoots(props: AppProps, testRunner: TestRunner) {
    if (props.rootConstruct) {
      const Root = props.rootConstruct;
      new Root(this, "Default");
    }
  }
}
