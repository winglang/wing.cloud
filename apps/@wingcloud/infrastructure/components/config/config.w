bring cloud;
bring util;
bring "./config.tfaws.w" as tfaws;
bring "./config.sim.w" as sim;
bring "./iconfig.w" as ic;

pub class Config impl ic.IConfig {
    platform: ic.IConfig;

    init () {
        if util.env("WING_TARGET") == "sim" {
            this.platform = new sim.Config();
        } else {
            this.platform = new tfaws.Config();
        }
    }

    pub add(name: str, value: str) {        
        this.platform.add(name, value);
    }

    pub inflight get(name: str): str { 
        return this.platform.get(name);       
    }
}