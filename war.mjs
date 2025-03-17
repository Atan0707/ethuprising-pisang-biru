import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors"
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
}));

let serverInstance = http.createServer(app);


const io = new Server(serverInstance, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const waitingPlayer = []
const activeGames = {}

app.get("/", (req, res) => {
    res.send("Socket.io server is running")
})

io.on("connection", (socket) => {
    console.log(`A user is connected ${socket.id}`)

    // handle join game with player data
    socket.on("joinGame", (playerData) => {
        console.log(`Player ${socket.id} wants to join the game with data:`, playerData)
        // Now playerData includes: imageUrl, name, baseDamage, health, and tokenId

        if (waitingPlayer.length > 0) {
            const opponentId = waitingPlayer[0].id;
            const opponentData = waitingPlayer[0].playerData;
            waitingPlayer.shift();
            const gameId = uuidv4();
            console.log(`Game Id: ${gameId}`)

            socket.join(gameId)
            io.sockets.sockets.get(opponentId).join(gameId);

            // Log the data being sent to each player
            console.log('Sending to first player:', {
                gameId,
                opponent: true,
                opponentData
            });

            io.to(socket.id).emit("gameStart", {
                gameId,
                opponent: true,
                opponentData  // This should include the tokenId
            });

            console.log('Sending to second player:', {
                gameId,
                opponent: true,
                opponentData: playerData
            });

            io.to(opponentId).emit("gameStart", {
                gameId,
                opponent: true,
                opponentData: playerData
            });

            activeGames[gameId] = {
                players: [
                    {
                        id: socket.id,
                        data: {
                            ...playerData,
                            tokenId: playerData.tokenId // Ensure tokenId is included
                        }
                    },
                    {
                        id: opponentId,
                        data: {
                            ...opponentData,
                            tokenId: opponentData.tokenId // Ensure tokenId is included
                        }
                    }
                ],
                gameId: gameId,
                moves: {},
            }

        } else {
            waitingPlayer.push({
                id: socket.id,
                playerData: {
                    ...playerData,
                    tokenId: playerData.tokenId // Ensure tokenId is stored
                }
            })
            socket.emit("waiting");
            console.log(`Player ${socket.id} is waiting for an opponent`)
        }
    });

    // Move this outside of joinGame handler
    socket.on("makeMove", (data) => {
        const game = activeGames[data.gameId]
        if (!game) return console.log("no game");

        game.moves[socket.id] = data.move

        // Find opponent with their data
        const opponentPlayer = game.players.find(player => player.id !== socket.id);
        if (opponentPlayer) {
            io.to(opponentPlayer.id).emit("opponentMoved");
        }

        if (Object.keys(game.moves).length === 2) {
            game.players.forEach(player => {
                const yourMove = game.moves[player.id];
                const opponent = game.players.find(p => p.id !== player.id);
                const opponentMove = game.moves[opponent.id];

                let result = {
                    yourMove,
                    opponentMove,
                    damageTo: "none",
                    manaGained: []
                };

                // Handle attack vs attack
                if (yourMove === "attack" && opponentMove === "attack") {
                    result.damageTo = "both";
                }
                // Handle attack vs mana
                else if (yourMove === "mana" && opponentMove === "attack") {
                    result.damageTo = "you";
                    result.manaGained = ["you"];
                } else if (yourMove === "attack" && opponentMove === "mana") {
                    result.damageTo = "opponent";
                    result.manaGained = ["opponent"];
                }
                // Handle mana charging - Modified this part
                else if (yourMove === "mana") {
                    result.manaGained.push("you");
                }
                if (opponentMove === "mana") {
                    result.manaGained.push("opponent");
                }

                io.to(player.id).emit("roundResult", result);
            });

            game.moves = {};
        }
    });

    // Add disconnect handler to clean up games
    socket.on("disconnect", () => {
        // Remove from waiting players
        const index = waitingPlayer.indexOf(socket.id);
        if (index > -1) {
            waitingPlayer.splice(index, 1);
        }

        // Clean up active games
        Object.entries(activeGames).forEach(([gameId, game]) => {
            if (game.players.includes(socket.id)) {
                const opponent = game.players.find(id => id !== socket.id);
                if (opponent) {
                    io.to(opponent).emit("opponentDisconnected");
                }
                delete activeGames[gameId];
            }
        });
    });
})

const PORT = 3006;
serverInstance.listen(PORT, () => {
    console.log(`listen to port ${PORT}`)
})