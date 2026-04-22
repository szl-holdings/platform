import http from 'node:http';
import net from 'node:net';

const port = parseInt(process.env.PORT || '8080', 10);

const earlyServer = net.createServer();
earlyServer.listen(port, '0.0.0.0', () => {
  earlyServer.close(async () => {
    const { default: app } = await import('./app.js');
    const real = http.createServer(app);
    real.listen(port, '0.0.0.0', () => {
    });
  });
});
