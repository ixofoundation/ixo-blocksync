require("dotenv").config();
import * as http from "http";

export default class ServerUtils {
    server: http.Server;
    port: any;

    constructor(server: http.Server, port: number) {
        this.server = server;
        this.port = this.normalisePort(port);
        this.onListening = this.onListening.bind(this);
        this.onError = this.onError.bind(this);
    };

    connect() {
        var self = this;
        self.server.listen(self.port);
        self.server.on("error", self.onError);
        self.server.on("listening", self.onListening);

        process.on("SIGTERM", () => {
            self.server.close(() => {
                process.exit(0);
            });
        });
    };

    onError(error: NodeJS.ErrnoException): void {
        if (error.syscall !== "listen") {
            throw error;
        };
        switch (error.code) {
            case 'EACCES':
                console.log("Elevated Privileges Required")
                process.exit(1);
            case 'EADDRINUSE':
                console.log("Already in Use")
                process.exit(1);
            default:
                throw error;
        };
    };

    onListening(): void {
        let addr = this.server.address();
        let bind = (typeof addr === "string") ? `Pipe ${addr}` : `Port ${addr.port}`;
        console.log(`Listening on ${bind}`);
    };

    normalisePort(val: number | string): number | string | boolean {
        let port: number = (typeof val === "string") ? parseInt(val, 10) : val;
        if (isNaN(port)) {
            return port;
        } else if (port >= 0) {
            return port;
        } else {
            return false;
        }
    };
};