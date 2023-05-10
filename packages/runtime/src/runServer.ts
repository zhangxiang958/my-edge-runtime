import http from 'http';

import { createHandler, CreateHanlderOptions } from "./create-handler"

export interface RunServerOptions extends CreateHanlderOptions {

}

export async function runServer(options: RunServerOptions) {
  const { hanlder } = createHandler(options);
  const httpServer = http.createServer(hanlder);
  httpServer.listen(18800, () => {
    console.log('server is up');
  });
}
