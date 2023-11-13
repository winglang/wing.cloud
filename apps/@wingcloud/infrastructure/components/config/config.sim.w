bring cloud;
bring "./iconfig.w" as ic;

pub class Config impl ic.IConfig {
    state: cloud.Bucket;
    key: str;

    init(props: ic.ConfigProps) {
        this.state = new cloud.Bucket();        
        this.key = "/config/${props.name}";        
        this.state.addObject(this.key, props.value);
    }

    pub inflight get(): str {
        return this.state.get(this.key);
    }    
}