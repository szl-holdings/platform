import net from 'node:net';

const LISTEN_PORT = 8080;
const TARGET_PORT = 9090;
const TARGET_HOST = '127.0.0.1';

const server = net.createServer((clientSocket) => {
  const targetSocket = net.connect(TARGET_PORT, TARGET_HOST, () => {
    clientSocket.pipe(targetSocket);
    targetSocket.pipe(clientSocket);
  });
  targetSocket.on('error', () => clientSocket.destroy());
  clientSocket.on('error', () => targetSocket.destroy());
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
  console.log(`  ➜  Local:   http://localhost:${LISTEN_PORT}/`);
  console.log(`  ➜  Network: http://0.0.0.0:${LISTEN_PORT}/`);
  console.log(`  ➜  Proxying to localhost:${TARGET_PORT}`);
});
