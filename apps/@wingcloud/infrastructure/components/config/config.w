bring cloud;
bring util;
bring "./config.tfaws.w" as tfaws;
bring "./config.sim.w" as sim;
bring "./iconfig.w" as ic;

pub class Config impl ic.IConfig {
    platform: ic.IConfig;

    init(props: ic.ConfigProps) {
        if util.env("WING_TARGET") == "sim" {
            this.platform = new sim.Config(props);
        } else {
            this.platform = new tfaws.Config(props);
        }
    }

    pub inflight get(): str { 
        return this.platform.get();    
    }
}