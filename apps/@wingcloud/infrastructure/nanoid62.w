bring util;

class Nanoid62 {
  pub static inflight generate(): str {
    let alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return util.nanoid(size: 22, alphabet: alphabet);
  }
}
