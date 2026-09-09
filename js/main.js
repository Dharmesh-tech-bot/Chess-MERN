const socket = io();

// Game state
let chessBoard;
let chessRules;
let players = {
    white: { name: '' },
    black: { name: '' }
};
let gameInProgress = false;

// DOM elements
const splashScreen = document.getElementById('splashScreen');
const welcomeMessage = document.getElementById('welcomeMessage');
const welcomeText = document.getElementById('welcomeText');
const boardElement = document.getElementById('chessboard');
const statusBar = document.getElementById('statusBar');
const startBtn = document.getElementById('startBtn');
const undoBtn = document.getElementById('undoBtn');
const quitBtn = document.getElementById('quitBtn');
const newGameBtn = document.getElementById('newGameBtn');
const whitePlayerDisplay = document.getElementById('whitePlayer');
const blackPlayerDisplay = document.getElementById('blackPlayer');
const currentTurnDisplay = document.getElementById('currentTurn');
const moveHistoryDisplay = document.getElementById('moveHistory');
const whiteCapturedDisplay = document.getElementById('whiteCaptured');
const blackCapturedDisplay = document.getElementById('blackCaptured');
const player1NameInput = document.getElementById('player1NameInput');
const player2NameInput = document.getElementById('player2NameInput');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatBox = document.getElementById('chatBox');

// Initialize
function init() {
    chessBoard = new ChessBoard();
    chessRules = new ChessRules(chessBoard);
    
    // Show splash screen for 2 seconds
    setTimeout(() => {
        splashScreen.classList.add('hidden');
        
        // Try to load saved game state
        const savedPlayerNames = loadPlayerNames();
        const hasGameState = chessBoard.loadFromStorage();
        
        if (savedPlayerNames && hasGameState && chessBoard.gameStarted) {
            // Resume saved game
            players.white.name = savedPlayerNames.white;
            players.black.name = savedPlayerNames.black;
            player1NameInput.value = savedPlayerNames.white;
            player2NameInput.value = savedPlayerNames.black;
            
            resumeGame();
        } else {
            // Clear any partial state
            localStorage.removeItem('chessGameState');
            localStorage.removeItem('chessPlayerNames');
            chessBoard.reset();
            chessBoard.render(boardElement);
        }
    }, 2000);
    
    setupEventListeners();
    setupSocketListeners(); // New function
}

//below code
// --- NEW: Socket Listeners ---
function setupSocketListeners() {
    // When the server sends the full game state (on join or resume)
    socket.on('gameState', (game) => {
        if (game.gameStatus === 'IN_PROGRESS') {
            players.white.name = game.players.white;
            players.black.name = game.players.black;
            resumeGame();
        }
    });

    // When someone else makes a move
    socket.on('moveMade', (moveData) => {
        // Sync the local board with the move from the server
        if (moveData.fromRow !== undefined) {
            chessBoard.makeMove(moveData.fromRow, moveData.fromCol, moveData.toRow, moveData.toCol);
            updateUIAfterMove();
        }
    });

    // When a chat message arrives
    socket.on('chatMessage', (data) => {
        const chatMessage = document.createElement('div');
        chatMessage.className = 'chat-message';
        chatMessage.innerHTML = `<strong>${data.player}:</strong> ${data.message}`;
        chatBox.appendChild(chatMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

//above code


function setupEventListeners() {
    startBtn.addEventListener('click', startGame);
    undoBtn.addEventListener('click', undoMove);
    newGameBtn.addEventListener('click', resetGame);
    quitBtn.addEventListener('click', quitGame);
    boardElement.addEventListener('click', handleBoardClick);
    
    // Chat functionality
    sendChatBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
}

function savePlayerNames() {
    localStorage.setItem('chessPlayerNames', JSON.stringify({
        white: players.white.name,
        black: players.black.name
    }));
}

function loadPlayerNames() {
    const saved = localStorage.getItem('chessPlayerNames');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Error loading player names:', e);
        }
    }
    return null;
}

function startGame() {
    const player1Name = player1NameInput.value.trim();
    const player2Name = player2NameInput.value.trim();
    
    if (!player1Name || !player2Name) {
        alert('Please enter both player names!');
        return;
    }

    // Tell the server we are starting
    //socket.emit('startGame');
    // 1. Tell the server your name so the terminal/chat knows who you are
    socket.emit('joinGame', player1Name); 
    socket.emit('joinGame', player2Name); 

    // 2. Tell the server to start the game and pass the names
    socket.emit('startGame', { white: player1Name, black: player2Name });
    
    players.white.name = player1Name;
    players.black.name = player2Name;
    savePlayerNames();
    
    gameInProgress = true;
    chessBoard.reset();
    updateUIAfterMove(); //NEW FUNCTION
    //localStartSequence(); // Use a helper to clean up UI
    chessBoard.gameStarted = true;
    chessBoard.saveToStorage();
    chessRules = new ChessRules(chessBoard);
    
    // Show welcome message
    welcomeText.textContent = `Have a good game, ${player1Name} and ${player2Name}!`;
    welcomeMessage.classList.remove('hidden');
    
    setTimeout(() => {
        welcomeMessage.classList.add('hidden');
    }, 3000);
    
    // Update displays
    whitePlayerDisplay.textContent = `White: ${players.white.name}`;
    blackPlayerDisplay.textContent = `Black: ${players.black.name}`;
    whitePlayerDisplay.classList.add('active');
    
    // Update button states
    player1NameInput.disabled = true;
    player2NameInput.disabled = true;
    startBtn.disabled = true;
    undoBtn.disabled = false;
    newGameBtn.disabled = false;
    quitBtn.disabled = false;
    
    updateTurnDisplay();
    updateStatusBar();
    chessBoard.render(boardElement);
    
    // Clear history and chat
    moveHistoryDisplay.innerHTML = '<div style="color: #999; font-style: italic;">Game started! Good luck!</div>';
    chatBox.innerHTML = `<div class="chat-message"><strong>System:</strong> Game started! ${players.white.name} (White) vs ${players.black.name} (Black)</div>`;
}

function resumeGame() {
    gameInProgress = true;
    chessRules = new ChessRules(chessBoard);
    
    // Update displays
    whitePlayerDisplay.textContent = `White: ${players.white.name}`;
    blackPlayerDisplay.textContent = `Black: ${players.black.name}`;
    
    // Update button states
    player1NameInput.disabled = true;
    player2NameInput.disabled = true;
    startBtn.disabled = true;
    undoBtn.disabled = false;
    newGameBtn.disabled = false;
    quitBtn.disabled = false;
    
    updateTurnDisplay();
    updateStatusBar();
    updateMoveHistory();
    updateCapturedPieces();
    chessBoard.render(boardElement);
    
    chatBox.innerHTML = `<div class="chat-message"><strong>System:</strong> Game resumed! ${players.white.name} (White) vs ${players.black.name} (Black)</div>`;
    
    // Check game status in case it was saved in a finished state
    const gameStatus = chessRules.getGameStatus();
    if (gameStatus.status === 'checkmate' || gameStatus.status === 'stalemate') {
        gameInProgress = false;
    }
}

//below code
function makeMove(fromRow, fromCol, toRow, toCol) {
    // 1. Update local board
    chessBoard.makeMove(fromRow, fromCol, toRow, toCol);
    
    // 2. Tell the server about the move
    socket.emit('makeMove', { fromRow, fromCol, toRow, toCol });
    
    updateUIAfterMove();
}

function updateUIAfterMove() {
    chessBoard.selectedSquare = null;
    chessBoard.validMoves = [];
    chessRules = new ChessRules(chessBoard);
    
    const gameStatus = chessRules.getGameStatus();
    updateTurnDisplay();
    updateMoveHistory();
    updateCapturedPieces();
    updateStatusBar(gameStatus);
    chessBoard.render(boardElement);
}

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Send to server instead of just adding to DOM
    socket.emit('chatMessage', message);
    chatInput.value = '';
}

//above code

function handleBoardClick(e) {
    //if (!gameInProgress) return;
    if (!gameInProgress && !chessBoard.gameStarted) return;

    
    const square = e.target.closest('.square');
    if (!square) return;
    
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    
    if (chessBoard.selectedSquare) {
        const selectedRow = chessBoard.selectedSquare.row;
        const selectedCol = chessBoard.selectedSquare.col;
        
        const isValidMove = chessBoard.validMoves.some(
            move => move.row === row && move.col === col
        );
        
        if (isValidMove) {
            makeMove(selectedRow, selectedCol, row, col);
        } else {
            selectSquare(row, col);
        }
    } else {
        selectSquare(row, col);
    }
}

function selectSquare(row, col) {
    const piece = chessBoard.getPiece(row, col);
    
    if (piece && chessBoard.getPieceColor(piece) === chessBoard.currentTurn) {
        chessBoard.selectedSquare = { row, col };
        chessBoard.validMoves = chessRules.getLegalMoves(row, col);
        chessBoard.render(boardElement);
    } else {
        chessBoard.selectedSquare = null;
        chessBoard.validMoves = [];
        chessBoard.render(boardElement);
    }
}

function makeMove(fromRow, fromCol, toRow, toCol) {
    // 1. Move locally
    chessBoard.makeMove(fromRow, fromCol, toRow, toCol);

    // // // 2. Sync to server
    // // socket.emit('makeMove', { fromRow, fromCol, toRow, toCol });

    // // // 3. Update all UI components
    // updateUIAfterMove();
    
    chessBoard.selectedSquare = null;
    chessBoard.validMoves = [];
    
    chessRules = new ChessRules(chessBoard);
    
    const gameStatus = chessRules.getGameStatus();
    
    updateTurnDisplay();
    updateMoveHistory();
    updateCapturedPieces();
    updateStatusBar(gameStatus);
    
    chessBoard.render(boardElement);
    
    // Handle game end
    if (gameStatus.status === 'checkmate') {
        gameInProgress = false;
        const winnerName = players[gameStatus.winner].name;
        setTimeout(() => {
            alert(`♔ CHECKMATE! ♔\n\n${winnerName} wins the game!`);
        }, 100);
    } else if (gameStatus.status === 'stalemate') {
        gameInProgress = false;
        setTimeout(() => {
            alert('⚖️ STALEMATE! ⚖️\n\nThe game is a draw.\nNo legal moves available, but king is not in check.');
        }, 100);
    }
}

function undoMove() {
    if (!gameInProgress) return;
    
    if (chessBoard.undoLastMove()) {
        chessRules = new ChessRules(chessBoard);
        
        chessBoard.selectedSquare = null;
        chessBoard.validMoves = [];
        
        updateTurnDisplay();
        updateMoveHistory();
        updateCapturedPieces();
        updateStatusBar();
        chessBoard.render(boardElement);
        
        chatBox.innerHTML += `<div class="chat-message"><strong>System:</strong> Last move undone</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    } else {
        alert('No moves to undo!');
    }
}

function updateTurnDisplay() {
    const currentPlayer = players[chessBoard.currentTurn].name;
    currentTurnDisplay.textContent = `${chessBoard.currentTurn === 'white' ? '♔' : '♚'} ${currentPlayer}'s turn`;
    
    if (chessBoard.currentTurn === 'white') {
        whitePlayerDisplay.classList.add('active');
        blackPlayerDisplay.classList.remove('active');
    } else {
        blackPlayerDisplay.classList.add('active');
        whitePlayerDisplay.classList.remove('active');
    }
}

function updateStatusBar(gameStatus = null) {
    if (!gameStatus) {
        gameStatus = chessRules.getGameStatus();
    }
    
    statusBar.classList.remove('check', 'checkmate', 'stalemate');
    
    if (gameStatus.status === 'checkmate') {
        const winnerName = players[gameStatus.winner].name;
        statusBar.textContent = `♔ CHECKMATE! ${winnerName} wins! ♔`;
        statusBar.classList.add('checkmate');
        highlightKingInCheck(chessBoard.currentTurn);
    } else if (gameStatus.status === 'stalemate') {
        statusBar.textContent = '⚖️ STALEMATE! The game is a draw! ⚖️';
        statusBar.classList.add('stalemate');
    } else if (gameStatus.status === 'check') {
        const currentPlayer = players[chessBoard.currentTurn].name;
        statusBar.textContent = `⚠️ CHECK! ${currentPlayer}'s king is in check! ⚠️`;
        statusBar.classList.add('check');
        highlightKingInCheck(chessBoard.currentTurn);
    } else {
        const currentPlayer = players[chessBoard.currentTurn].name;
        statusBar.textContent = `${currentPlayer}'s turn to move`;
    }
}

function highlightKingInCheck(color) {
    const kingPos = chessBoard.findKing(color);
    if (kingPos) {
        const squares = boardElement.querySelectorAll('.square');
        squares.forEach(square => {
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            if (row === kingPos.row && col === kingPos.col) {
                square.classList.add('in-check');
            }
        });
    }
}

function updateMoveHistory() {
    if (chessBoard.moveHistory.length === 0) {
        moveHistoryDisplay.innerHTML = '<div style="color: #999; font-style: italic;">No moves yet...</div>';
        return;
    }
    
    // const lastMoves = chessBoard.moveHistory.slice(-10);
    const lastMoves = chessBoard.moveHistory;
    moveHistoryDisplay.innerHTML = lastMoves.map((move, index) => {
        const moveNumber = chessBoard.moveHistory.length - lastMoves.length + index + 1;
        const playerColor = moveNumber % 2 === 1 ? 'white' : 'black';
        const playerName = players[playerColor].name;
        const pieceSymbol = PIECES[move.piece] || move.piece;
        
        return `
            <div class="move-item">
                <strong>${moveNumber}.</strong> ${playerName} (${pieceSymbol}): ${move.notation}
                ${move.captured ? `<span style="color: red;"> captured ${PIECES[move.captured]}</span>` : ''}
            </div>
        `;
    }).join('');
    
    moveHistoryDisplay.scrollTop = moveHistoryDisplay.scrollHeight;
}

function updateCapturedPieces() {
    whiteCapturedDisplay.innerHTML = chessBoard.capturedPieces.white
        .map(piece => PIECES[piece])
        .join(' ');
    
    blackCapturedDisplay.innerHTML = chessBoard.capturedPieces.black
        .map(piece => PIECES[piece])
        .join(' ');
}

function resetGame() {
    if (gameInProgress) {
        if (!confirm('Start a new game? Current game will be lost.')) {
            return;
        }
    }
    
    gameInProgress = false;
    
    // Clear localStorage
    localStorage.removeItem('chessGameState');
    localStorage.removeItem('chessPlayerNames');
    
    player1NameInput.disabled = false;
    player2NameInput.disabled = false;
    player1NameInput.value = '';
    player2NameInput.value = '';
    startBtn.disabled = false;
    undoBtn.disabled = true;
    newGameBtn.disabled = true;
    quitBtn.disabled = true;
    
    chessBoard.reset();
    chessRules = new ChessRules(chessBoard);
    chessBoard.render(boardElement);
    
    whitePlayerDisplay.textContent = 'White: Waiting...';
    blackPlayerDisplay.textContent = 'Black: Waiting...';
    whitePlayerDisplay.classList.remove('active');
    blackPlayerDisplay.classList.remove('active');
    currentTurnDisplay.textContent = "White's turn";
    statusBar.textContent = 'Enter both player names and click Start Game!';
    statusBar.classList.remove('check', 'checkmate', 'stalemate');
    
    moveHistoryDisplay.innerHTML = '<div style="color: #999; font-style: italic;">Move history will appear here...</div>';
    whiteCapturedDisplay.innerHTML = '';
    blackCapturedDisplay.innerHTML = '';
    chatBox.innerHTML = '<div style="color: #999; font-style: italic;">Chat messages will appear here...</div>';
}

function quitGame() {
    if (!gameInProgress) return;
    
    const currentPlayer = players[chessBoard.currentTurn].name;
    const opponent = chessBoard.currentTurn === 'white' ? players.black.name : players.white.name;
    
    if (confirm(`${currentPlayer}, are you sure you want to quit?\n\n${opponent} will win the game!`)) {
        gameInProgress = false;
        
        const winner = chessBoard.currentTurn === 'white' ? 'black' : 'white';
        const winnerName = players[winner].name;
        
        statusBar.textContent = `🏳️ ${currentPlayer} quit! ${winnerName} wins! 🏳️`;
        statusBar.classList.add('checkmate');
        
        chatBox.innerHTML += `<div class="chat-message"><strong>System:</strong> ${currentPlayer} has quit the game. ${winnerName} wins by forfeit!</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        
        // Clear localStorage for this game
        localStorage.removeItem('chessGameState');
        
        setTimeout(() => {
            alert(`🏳️ ${currentPlayer} has quit!\n\n${winnerName} wins by forfeit!`);
        }, 100);
    }
}

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (!message || !gameInProgress) return;
    
    const currentPlayer = players[chessBoard.currentTurn].name;
    
    const chatMessage = document.createElement('div');
    chatMessage.className = 'chat-message';
    chatMessage.innerHTML = `<strong>${currentPlayer}:</strong> ${message}`;
    
    chatBox.appendChild(chatMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    chatInput.value = '';
}

// Initialize when page loads
window.addEventListener('DOMContentLoaded', init);









// // Initialize Socket.io
// const socket = io();

// // Game state
// let chessBoard;
// let chessRules;
// let players = {
//     white: { name: '' },
//     black: { name: '' }
// };
// let gameInProgress = false;

// // DOM elements
// const splashScreen = document.getElementById('splashScreen');
// const welcomeMessage = document.getElementById('welcomeMessage');
// const welcomeText = document.getElementById('welcomeText');
// const boardElement = document.getElementById('chessboard');
// const statusBar = document.getElementById('statusBar');
// const startBtn = document.getElementById('startBtn');
// const undoBtn = document.getElementById('undoBtn');
// const quitBtn = document.getElementById('quitBtn');
// const newGameBtn = document.getElementById('newGameBtn');
// const whitePlayerDisplay = document.getElementById('whitePlayer');
// const blackPlayerDisplay = document.getElementById('blackPlayer');
// const currentTurnDisplay = document.getElementById('currentTurn');
// const moveHistoryDisplay = document.getElementById('moveHistory');
// const whiteCapturedDisplay = document.getElementById('whiteCaptured');
// const blackCapturedDisplay = document.getElementById('blackCaptured');
// const player1NameInput = document.getElementById('player1NameInput');
// const player2NameInput = document.getElementById('player2NameInput');
// const chatInput = document.getElementById('chatInput');
// const sendChatBtn = document.getElementById('sendChatBtn');
// const chatBox = document.getElementById('chatBox');

// // Initialize
// function init() {
//     chessBoard = new ChessBoard();
//     chessRules = new ChessRules(chessBoard);
    
//     setTimeout(() => {
//         splashScreen.classList.add('hidden');
//         // Tell server we've connected
//         socket.emit('joinGame', 'Guest'); 
//     }, 2000);
    
//     setupEventListeners();
//     setupSocketListeners();
// }

// // --- Socket Listeners ---
// function setupSocketListeners() {
//     // Sync state when joining an existing session
//     socket.on('gameState', (game) => {
//         if (game.gameStatus === 'IN_PROGRESS') {
//             players.white.name = game.players.white || 'White';
//             players.black.name = game.players.black || 'Black';
//             resumeGame();
//         }
//     });

//     // Handle game start from server
//     socket.on('gameStarted', (gameData) => {
//         players.white.name = gameData.players.white;
//         players.black.name = gameData.players.black;
//         localStartSequence();
//     });

//     // Receive moves from the other player
//     socket.on('moveMade', (moveData) => {
//         // We only process if it's not our own move (already handled locally)
//         // Or we process all to ensure sync. Let's use the local board logic:
//         chessBoard.makeMove(moveData.fromRow, moveData.fromCol, moveData.toRow, moveData.toCol);
//         updateUIAfterMove();
//     });

//     // Receive chat messages
//     socket.on('chatMessage', (data) => {
//         addChatMessage(data.player, data.message);
//     });

//     socket.on('gameReset', () => {
//         location.reload(); 
//     });
// }

// function setupEventListeners() {
//     startBtn.addEventListener('click', startGame);
//     undoBtn.addEventListener('click', undoMove);
//     newGameBtn.addEventListener('click', resetGame);
//     quitBtn.addEventListener('click', quitGame);
//     boardElement.addEventListener('click', handleBoardClick);
    
//     sendChatBtn.addEventListener('click', sendChatMessage);
//     chatInput.addEventListener('keypress', (e) => {
//         if (e.key === 'Enter') sendChatMessage();
//     });
// }

// // --- Game Logic ---

// function startGame() {
//     const p1 = player1NameInput.value.trim();
//     const p2 = player2NameInput.value.trim();
    
//     if (!p1 || !p2) {
//         alert('Please enter both player names!');
//         return;
//     }

//     // FIX: Update names locally first
//     players.white.name = p1;
//     players.black.name = p2;

//     // FIX: Tell server who is playing so terminal shows names
//     socket.emit('joinGame', p1); // Sets the name for the current socket
    
//     // Send start signal with player data
//     socket.emit('startGame', { white: p1, black: p2 }); 
// }

// function localStartSequence() {
//     gameInProgress = true;
//     chessBoard.reset();
//     chessBoard.gameStarted = true;
//     chessRules = new ChessRules(chessBoard);
    
//     welcomeText.textContent = `Have a good game, ${players.white.name} and ${players.black.name}!`;
//     welcomeMessage.classList.remove('hidden');
//     setTimeout(() => welcomeMessage.classList.add('hidden'), 3000);
    
//     // UI Updates
//     whitePlayerDisplay.textContent = `White: ${players.white.name}`;
//     blackPlayerDisplay.textContent = `Black: ${players.black.name}`;
//     whitePlayerDisplay.classList.add('active');
    
//     player1NameInput.disabled = true;
//     player2NameInput.disabled = true;
//     startBtn.disabled = true;
//     undoBtn.disabled = false;
//     newGameBtn.disabled = false;
//     quitBtn.disabled = false;

//     moveHistoryDisplay.innerHTML = '<div style="color: #999; font-style: italic;">Game started!</div>';
//     updateUIAfterMove();
// }

// function handleBoardClick(e) {
//     if (!gameInProgress) return;
    
//     const square = e.target.closest('.square');
//     if (!square) return;
    
//     const row = parseInt(square.dataset.row);
//     const col = parseInt(square.dataset.col);
    
//     if (chessBoard.selectedSquare) {
//         const { row: sRow, col: sCol } = chessBoard.selectedSquare;
//         const isValid = chessBoard.validMoves.some(m => m.row === row && m.col === col);
        
//         if (isValid) {
//             // Send move to server
//             socket.emit('makeMove', { fromRow: sRow, fromCol: sCol, toRow: row, toCol: col });
//         } else {
//             selectSquare(row, col);
//         }
//     } else {
//         selectSquare(row, col);
//     }
// }

// function selectSquare(row, col) {
//     const piece = chessBoard.getPiece(row, col);
//     if (piece && chessBoard.getPieceColor(piece) === chessBoard.currentTurn) {
//         chessBoard.selectedSquare = { row, col };
//         chessBoard.validMoves = chessRules.getLegalMoves(row, col);
//     } else {
//         chessBoard.selectedSquare = null;
//         chessBoard.validMoves = [];
//     }
//     chessBoard.render(boardElement);
// }

// function updateUIAfterMove() {
//     chessBoard.selectedSquare = null;
//     chessBoard.validMoves = [];
//     chessRules = new ChessRules(chessBoard);
    
//     const status = chessRules.getGameStatus();
    
//     updateTurnDisplay();
//     updateMoveHistory();
//     updateCapturedPieces();
//     updateStatusBar(status);
//     chessBoard.render(boardElement);
    
//     if (status.status === 'checkmate' || status.status === 'stalemate') {
//         gameInProgress = false;
//     }
// }

// // --- UI Helpers ---

// function updateTurnDisplay() {
//     const currentPlayer = players[chessBoard.currentTurn].name;
//     currentTurnDisplay.textContent = `${chessBoard.currentTurn === 'white' ? '♔' : '♚'} ${currentPlayer}'s turn`;
    
//     if (chessBoard.currentTurn === 'white') {
//         whitePlayerDisplay.classList.add('active');
//         blackPlayerDisplay.classList.remove('active');
//     } else {
//         blackPlayerDisplay.classList.add('active');
//         whitePlayerDisplay.classList.remove('active');
//     }
// }

// function updateMoveHistory() {
//     if (chessBoard.moveHistory.length === 0) {
//         moveHistoryDisplay.innerHTML = '<div style="color: #999; font-style: italic;">No moves yet...</div>';
//         return;
//     }
    
//     // FIX: Render ALL moves so history doesn't erase
//     moveHistoryDisplay.innerHTML = chessBoard.moveHistory.map((move, index) => {
//         const moveNumber = index + 1;
//         const playerColor = moveNumber % 2 === 1 ? 'white' : 'black';
//         const playerName = players[playerColor].name || playerColor;
//         const pieceSymbol = PIECES[move.piece] || move.piece;
        
//         return `
//             <div class="move-item">
//                 <strong>${moveNumber}.</strong> ${playerName} (${pieceSymbol}): ${move.notation}
//                 ${move.captured ? `<span style="color: #ff4444;"> captured ${PIECES[move.captured]}</span>` : ''}
//             </div>
//         `;
//     }).join('');
    
//     moveHistoryDisplay.scrollTop = moveHistoryDisplay.scrollHeight;
// }

// function updateCapturedPieces() {
//     whiteCapturedDisplay.innerHTML = chessBoard.capturedPieces.white.map(p => PIECES[p]).join(' ');
//     blackCapturedDisplay.innerHTML = chessBoard.capturedPieces.black.map(p => PIECES[p]).join(' ');
// }

// function updateStatusBar(gameStatus) {
//     if (!gameStatus) gameStatus = chessRules.getGameStatus();
//     statusBar.className = 'status-bar ' + gameStatus.status;
    
//     if (gameStatus.status === 'checkmate') {
//         statusBar.textContent = `♔ CHECKMATE! ${players[gameStatus.winner].name} wins!`;
//     } else if (gameStatus.status === 'check') {
//         statusBar.textContent = `⚠️ CHECK! ${players[chessBoard.currentTurn].name} is in danger!`;
//     } else {
//         statusBar.textContent = `${players[chessBoard.currentTurn].name}'s turn`;
//     }
// }

// function sendChatMessage() {
//     const message = chatInput.value.trim();
//     if (!message) return;
//     socket.emit('chatMessage', message); 
//     chatInput.value = '';
// }

// function addChatMessage(sender, message) {
//     const msgDiv = document.createElement('div');
//     msgDiv.className = 'chat-message';
//     msgDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
//     chatBox.appendChild(msgDiv);
//     chatBox.scrollTop = chatBox.scrollHeight;
// }

// function undoMove() {
//     // Note: To sync undo, you'd need a socket emit('undo'). 
//     // For now, local only:
//     if (chessBoard.undoLastMove()) updateUIAfterMove();
// }

// function resetGame() {
//     if (confirm('Reset the game for all players?')) {
//         socket.emit('newGame');
//     }
// }

// function quitGame() {
//     if (confirm('Are you sure you want to quit?')) {
//         location.reload();
//     }
// }

// function resumeGame() {
//     gameInProgress = true;
//     updateUIAfterMove();
// }

// window.addEventListener('DOMContentLoaded', init);