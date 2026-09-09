// const express = require('express');
// const path = require('path');

// const app = express();

// // Serve static files
// app.use(express.static(__dirname));
// app.use('/css', express.static(path.join(__dirname, 'css')));
// app.use('/js', express.static(path.join(__dirname, 'js')));

// // Main route
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'index.html'));
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`🚀 Chess Server running on http://localhost:${PORT}`);
//     console.log('✅ Ready to play! Open your browser and start the game!');
// });





const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files ✅ FIXED
app.use(express.static(path.join(__dirname)));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const games = new Map(); // roomId -> gameState
const players = new Map(); // socketId -> playerInfo

io.on('connection', (socket) => {
    console.log('✅ Player connected:', socket.id);
    
    // Player joins game room
    socket.on('joinGame', (playerName) => {
        const roomId = 'chess_lobby';
        socket.join(roomId);
        
        // Store player info
        players.set(socket.id, { name: playerName || 'Anonymous', color: null });
        console.log(`Player ${playerName} joined room ${roomId}`);
        
        // Initialize game if first player
        if (!games.has(roomId)) {
            games.set(roomId, {
                boardState: null,
                turn: 'w',
                gameStatus: 'WAITING',
                players: { white: null, black: null },
                moveHistory: [],
                chat: []
            });
        }
        
        const game = games.get(roomId);
        io.to(roomId).emit('gameState', game);
        socket.emit('playerJoined', { players: Object.values(players) });
    });
    
    // Start game (2 players ready)
    socket.on('startGame', () => {
        const roomId = 'chess_lobby';
        const game = games.get(roomId);
        
        if (!game) return;
        
        // Assign colors to players
        const playerList = Array.from(players.values());
        if (playerList.length >= 2) {
            game.players.white = playerList[0].name;
            game.players.black = playerList[1].name;
            game.gameStatus = 'IN_PROGRESS';
            game.turn = 'w';
            
            io.to(roomId).emit('gameStarted', game);
            console.log('🎮 GAME STARTED!');
        }
    });
    
    // Handle moves
    socket.on('makeMove', (moveData) => {
        const roomId = 'chess_lobby';
        const game = games.get(roomId);
        
        if (game && game.gameStatus === 'IN_PROGRESS') {
            game.moveHistory.push(moveData);
            io.to(roomId).emit('moveMade', moveData);
        }
    });
    
    // Chat messages
    socket.on('chatMessage', (msg) => {
        const roomId = 'chess_lobby';
        const player = players.get(socket.id);
        const message = {
            player: player?.name || 'Anonymous',
            message: msg,
            timestamp: new Date().toLocaleTimeString()
        };
        
        const game = games.get(roomId);
        if (game) {
            game.chat.push(message);
            io.to(roomId).emit('chatMessage', message);
        }
    });
    
    // New game
    socket.on('newGame', () => {
        const roomId = 'chess_lobby';
        games.set(roomId, {
            boardState: null,
            turn: 'w',
            gameStatus: 'WAITING',
            players: { white: null, black: null },
            moveHistory: [],
            chat: []
        });
        io.to(roomId).emit('gameReset', games.get(roomId));
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Player disconnected:', socket.id);
        players.delete(socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Chess Server running on http://localhost:${PORT}`);
    console.log('✅ Ready for players!');
});
