// Servidor local para jogar sem instalar nada.
// Rodar:  node tools/serve.mjs      (Ctrl+C para parar)
// Depois de mudar algum arquivo, aperte F5 no navegador.

import { startServer } from '../tests/browser.mjs';

const port = Number(process.env.PORT) || 5500;
try {
  const { url } = await startServer(port);
  console.log(`A Lenda de Ether rodando em ${url}`);
  console.log('Abra esse endereço no navegador. Ctrl+C para parar.');
} catch (err){
  if (err.code === 'EADDRINUSE') console.error(`A porta ${port} já está em uso (talvez o servidor já esteja aberto em http://127.0.0.1:${port}/).`);
  else console.error(err.message);
  process.exit(1);
}
