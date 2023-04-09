require("log-timestamp");

import { app } from "./app";
import http from "http";
import { Server } from "socket.io";
import * as SyncBlocks from "./sync/sync_blocks";
import { PORT } from "./util/secrets";
import * as SyncChain from "./sync/sync_chain";

SyncChain.syncChain().then(() => SyncBlocks.startSync());

const server = http.createServer(app);
export const io = new Server(server);

server.listen(PORT, () => console.log(`Listening on ${PORT}`));

io.on("connection", (socket) => {
  console.log("User Connected");
  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});
