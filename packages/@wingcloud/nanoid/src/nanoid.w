bring util;

pub class Nanoid {
	pub static inflight nanoid62(): str {
		let alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		return util.nanoid(size: 22, alphabet: alphabet);
	}
	pub static inflight nanoid36(): str {
		let alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
		return util.nanoid(size: 25, alphabet: alphabet);
	}
}
