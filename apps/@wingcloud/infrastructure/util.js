exports.toResource = (x) => x;

exports.replaceAll = (str, regex, replacement) => {
  return str.replaceAll(new RegExp(regex, "g"), replacement);
};

exports.parseLog = (log) => {
  const regex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s(.*)$/;
  const match = log.match(regex);
  if (!match && !log) {
    return;
  }
  return {
    time: match ? match[1] : "",
    message: match ? match[2] : "",
  };
};

exports.parseLogs = (logs) => {
  const parsedLogs = [];
  let previousTime = "";
  for (const log of logs) {
    const parsedLog = this.parseLog(log);
    if (!parsedLog) {
      continue;
    }
    if (parsedLog.time) {
      previousTime = parsedLog.time;
    } else {
      parsedLog.time = previousTime;
    }
    parsedLogs.push(parsedLog);
  }
  return parsedLogs;
};
