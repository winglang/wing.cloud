bring cloud;
bring util;
bring "./parameter.tfaws.w" as tfaws;
bring "./parameter.sim.w" as sim;
bring "./iparameter.w" as i;

pub class Parameter impl i.IParameter {
  platform: i.IParameter;

  init(props: i.ParameterProps) {
    if util.env("WING_TARGET") == "sim" {
      this.platform = new sim.Parameter(props);
    } else {
      this.platform = new tfaws.Parameter(props);
    }
  }

  pub inflight get(): str { 
    return this.platform.get();    
  }
}