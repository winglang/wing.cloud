works only with the wing-cloud-testing account in this configuration

see https://github.com/rebuy-de/aws-nuke

```
brew install aws-nuke
```

test with: `aws-nuke -c config.yml --force --force-sleep 3`
actually destroy with: `aws-nuke -c config.yml --no-dry-run --force --force-sleep 3`