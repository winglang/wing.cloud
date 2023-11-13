bring cloud;

pub interface IConfig {
    add(key: str, value: str): void;
    inflight get(key: str): str;
}