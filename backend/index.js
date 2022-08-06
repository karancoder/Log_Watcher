const express = require("express");
const app = express();
const http = require("http");
const fs = require("fs");
// const cors = require("cors");
const socketIO = require("socket.io");

const LOG_FILE_PATH = "./logs/example_log.log";

let lastModified = null;

const port = 3000;

let server = http.createServer(app);
let io = socketIO(server, {
    cors: {
        origin: "*",
    },
});

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

// make connection with user from server side
io.on("connection", (socket) => {
    console.log("New user connected");

    // when server disconnects from user
    socket.on("disconnect", () => {
        console.log("disconnected from user");
    });

    socket.on("sendNewLogs", () => {
        pollAndSendUpdatedLogs(socket, true);
    });

    setInterval(() => pollAndSendUpdatedLogs(socket, false), 1000);
});

function pollAndSendUpdatedLogs(socket, forceSend) {
    try {
        const stats = fs.statSync(LOG_FILE_PATH);

        // *: print file last modified date
        // console.log(`File Data Last Modified: ${stats.mtime}`);
        // console.log(`File Status Last Modified: ${stats.ctime}`);
        if (
            !forceSend &&
            lastModified != null &&
            lastModified.getTime() === stats.mtime.getTime()
        ) {
            console.log("Last modified equal");
            return;
        }

        lastModified = stats.mtime;
        let extendedBufferLength = 30;
        let buffer = new Buffer.alloc(extendedBufferLength);
        let data = "";

        // *: replace below with binary search
        while (
            data.split("\n").length < 10 &&
            stats.size - buffer.length >= 0
        ) {
            buffer = new Buffer.alloc(extendedBufferLength);
            console.log("Open existing file");
            const fd = fs.openSync(LOG_FILE_PATH, "r+");
            console.log("Reading the file");
            let bytes = fs.readSync(
                fd,
                buffer,
                0,
                buffer.length,
                stats.size - buffer.length
            );
            if (bytes > 0) {
                data = buffer.slice(0, bytes).toString();
                console.log(data);
            }
            console.log(bytes + " bytes read");

            fs.closeSync(fd);
            extendedBufferLength += 30;
        }

        data = data.split("\n").splice(-10).join("\n");

        socket.emit("newLogs", {
            newLogs: data,
            lastModified: lastModified,
        });

        // fs.readFile(LOG_FILE_PATH, "utf8", function (err, data) {
        //     socket.emit("newLogs", {
        //         newLogs: data,
        //         lastModified: lastModified,
        //     });
        // });
    } catch (error) {
        console.log(error);
    }
}
