'use strict';

const os = require('os');
const { createApp } = require('./app');

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

const app = createApp();

app.listen(PORT, HOST, () => {
  console.log(`API prête sur http://localhost:${PORT}`);
  for (const address of lanAddresses()) {
    console.log(`  depuis un téléphone : http://${address}:${PORT}`);
  }
});

/** Adresses IPv4 du réseau local, pour se connecter depuis un vrai téléphone. */
function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === 'IPv4' && !iface.internal)
    .map((iface) => iface.address);
}
