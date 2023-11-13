bring cloud;

pub interface IConfig {
    inflight get(): str;
}

pub struct ConfigProps {
    name: str;
    value: str;
}