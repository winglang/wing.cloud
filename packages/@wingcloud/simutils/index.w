bring cloud;
bring util;
bring sim;

pub interface Process {
	inflight kill(): void;
}

pub interface Buffer {
  toString(): str;
}

pub struct SyncProcess {
	status: num?;
  stdout: Buffer;
  stderr: Buffer;
}

pub struct SpawnSyncOptions {
	cwd: str?;
	env: Map<str>?;
}

pub struct ServiceProps {
	cwd: str?;
	env: Map<str>?;
	onData: inflight (str): void;
}

pub class Service {
	new(command: str, args: Array<str>, props: ServiceProps) {
		let commonEnv = Map<str>{
			"HOME" => util.env("HOME"),
			"PATH" => util.env("PATH"),
		};
		new cloud.Service(inflight () => {
			let env = commonEnv.copyMut();
			if let propsEnv = props.env {
				for key in propsEnv.keys() {
					env.set(key, propsEnv.get(key));
				}
			}
			let child = Service.spawn(
				command,
				args,
				cwd: props.cwd,
				env: env?.copy(),
				onData: props.onData,
			);
			return () => {
				child.kill();
			};
		});
	}
  static mergeEnv(env: Map<str>): Map<str> {
    let commonEnv = MutMap<str>{
			"HOME" => util.env("HOME"),
			"PATH" => util.env("PATH"),
		};
    for key in env.keys() {
      commonEnv.set(key, env.get(key));
    }
    return commonEnv.copy();
  }
  pub static spawnSync(file: str, args: Array<str>, options: SpawnSyncOptions?): SyncProcess {
    return Service.spawnSync_(
      file,
      args,
      cwd: options?.cwd,
      env: Service.mergeEnv(options?.env ?? {}),
    );
  }
	extern "./index.js" static inflight spawn(file: str, args: Array<str>, options: ServiceProps?): Process;
	extern "./spawn-sync.cjs" static spawnSync_(file: str, args: Array<str>, options: SpawnSyncOptions?): SyncProcess;
}

pub class Port {
	pub port: str;
	new() {
		let state = new sim.State();
		this.port = state.token("port");
		new cloud.Service(inflight () => {
			state.set("port", "${Port.findPort()}");
		});
	}
	extern "./index.js" static inflight findPort(): num;
}
