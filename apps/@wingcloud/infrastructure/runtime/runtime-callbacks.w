bring cloud;

pub class RuntimeCallbacks {
  pub topic: cloud.Topic;

  init() {
    this.topic = new cloud.Topic();
  }

  pub onStatus(callback: inflight (str): void) {
    this.topic.onMessage(inflight (evt) => {
      callback(evt);
    });
  }
}
