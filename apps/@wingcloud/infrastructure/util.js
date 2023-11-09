exports.toResource = (x) => x;

exports.replaceAll = (str, regex, replacement) => {
  return str.replaceAll(new RegExp(regex, "g"), replacement);
};
