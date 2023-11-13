bring cloud;
bring "./iconfig.w" as ic;

pub class Config impl ic.IConfig {
    state: cloud.Bucket;

    init() {
        this.state = new cloud.Bucket();        
    }

    pub static key(name: str): str {
        return "/config/${name}";
    }

    pub static inflight keyInflight(name: str): str {
        return "/config/${name}";
    }

    pub add(name: str, value: str) {
        this.state.addObject(Config.key(name), value);
    }

    pub inflight get(name: str): str {
        return this.state.get(Config.keyInflight(name));
    }    
}