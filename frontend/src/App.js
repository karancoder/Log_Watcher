import { useEffect, useState } from "react";
import io from "socket.io-client";

const SERVER_URL = "http://localhost:3000";

const socket = io(SERVER_URL);

function App() {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        // connection with server
        socket.on("connect", function () {
            console.log("Connected to Server");
        });

        // message listener from server
        socket.on("newLogs", function (message) {
            console.log(message);
            setLogs(message.newLogs.split("\n"));
        });

        socket.on("disconnect", function () {
            console.log("Disconnect from server");
        });

        socket.emit("sendNewLogs");

        return () => {
            socket.off("connect");
            socket.off("newLogs");
            socket.off("disconnect");
        };
    }, []);

    return (
        <div className="App">
            <div className="logs-list">
                {logs != null &&
                    logs.map((log, index) => <li key={index}>{log}</li>)}
            </div>
        </div>
    );
}

export default App;
