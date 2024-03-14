const { connect } = require("../client/dist/index");

module.exports.startTunnelsClient = (port, subdomain, hostname, wsServer) => {
  return new Promise(resolve => {
    connect({ port, subdomain, hostname, wsServer }).then((d) => {
      console.log("client connected", d.domain);
      resolve(d);
    })
  });
}
