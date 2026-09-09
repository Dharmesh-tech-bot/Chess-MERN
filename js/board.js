// Chess piece Unicode symbols
const PIECES = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

// Initial chess board setup
const INITIAL_BOARD = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

class ChessBoard {
    constructor() {
        this.board = JSON.parse(JSON.stringify(INITIAL_BOARD));
        this.selectedSquare = null;
        this.validMoves = [];
        this.currentTurn = 'white';
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.lastMove = null;
        this.whiteKingMoved = false;
        this.blackKingMoved = false;
        this.whiteRooksMoved = { left: false, right: false };
        this.blackRooksMoved = { left: false, right: false };
        this.enPassantTarget = null;
        this.gameStarted = false;
    }

    reset() {
        this.board = JSON.parse(JSON.stringify(INITIAL_BOARD));
        this.selectedSquare = null;
        this.validMoves = [];
        this.currentTurn = 'white';
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.lastMove = null;
        this.whiteKingMoved = false;
        this.blackKingMoved = false;
        this.whiteRooksMoved = { left: false, right: false };
        this.blackRooksMoved = { left: false, right: false };
        this.enPassantTarget = null;
        this.gameStarted = false;
    }

    // Convert board to FEN string
    toFEN() {
        let fen = '';
        
        // Board position
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece === '') {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    fen += piece;
                }
            }
            if (emptyCount > 0) {
                fen += emptyCount;
            }
            if (row < 7) {
                fen += '/';
            }
        }
        
        // Active color
        fen += ' ' + (this.currentTurn === 'white' ? 'w' : 'b');
        
        // Castling rights
        let castling = '';
        if (!this.whiteKingMoved) {
            if (!this.whiteRooksMoved.right) castling += 'K';
            if (!this.whiteRooksMoved.left) castling += 'Q';
        }
        if (!this.blackKingMoved) {
            if (!this.blackRooksMoved.right) castling += 'k';
            if (!this.blackRooksMoved.left) castling += 'q';
        }
        fen += ' ' + (castling || '-');
        
        // En passant
        if (this.enPassantTarget) {
            const files = 'abcdefgh';
            const ranks = '87654321';
            fen += ' ' + files[this.enPassantTarget.col] + ranks[this.enPassantTarget.row];
        } else {
            fen += ' -';
        }
        
        // Halfmove and fullmove (simplified)
        fen += ' 0 1';
        
        return fen;
    }

    // Load from FEN string
    loadFEN(fen) {
        const parts = fen.split(' ');
        if (parts.length < 4) return false;
        
        try {
            // Parse board
            const rows = parts[0].split('/');
            if (rows.length !== 8) return false;
            
            this.board = [];
            for (let row = 0; row < 8; row++) {
                this.board[row] = [];
                let col = 0;
                for (let char of rows[row]) {
                    if (char >= '1' && char <= '8') {
                        const emptySquares = parseInt(char);
                        for (let i = 0; i < emptySquares; i++) {
                            this.board[row][col++] = '';
                        }
                    } else {
                        this.board[row][col++] = char;
                    }
                }
            }
            
            // Parse turn
            this.currentTurn = parts[1] === 'w' ? 'white' : 'black';
            
            // Parse castling rights
            const castling = parts[2];
            this.whiteKingMoved = !castling.includes('K') && !castling.includes('Q');
            this.blackKingMoved = !castling.includes('k') && !castling.includes('q');
            this.whiteRooksMoved.right = !castling.includes('K');
            this.whiteRooksMoved.left = !castling.includes('Q');
            this.blackRooksMoved.right = !castling.includes('k');
            this.blackRooksMoved.left = !castling.includes('q');
            
            // Parse en passant
            if (parts[3] !== '-') {
                const files = 'abcdefgh';
                const ranks = '87654321';
                const col = files.indexOf(parts[3][0]);
                const row = ranks.indexOf(parts[3][1]);
                if (col >= 0 && row >= 0) {
                    this.enPassantTarget = { row, col };
                }
            } else {
                this.enPassantTarget = null;
            }
            
            return true;
        } catch (e) {
            console.error('Error loading FEN:', e);
            return false;
        }
    }

    // Save to localStorage
    saveToStorage() {
        const gameState = {
            fen: this.toFEN(),
            moveHistory: this.moveHistory,
            capturedPieces: this.capturedPieces,
            lastMove: this.lastMove,
            gameStarted: this.gameStarted
        };
        localStorage.setItem('chessGameState', JSON.stringify(gameState));
    }

    // Load from localStorage
    loadFromStorage() {
        const saved = localStorage.getItem('chessGameState');
        if (saved) {
            try {
                const gameState = JSON.parse(saved);
                if (gameState.fen) {
                    this.loadFEN(gameState.fen);
                    this.moveHistory = gameState.moveHistory || [];
                    this.capturedPieces = gameState.capturedPieces || { white: [], black: [] };
                    this.lastMove = gameState.lastMove || null;
                    this.gameStarted = gameState.gameStarted || false;
                    return true;
                }
            } catch (e) {
                console.error('Error loading from storage:', e);
            }
        }
        return false;
    }

    getPiece(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) return null;
        return this.board[row][col] || null;
    }

    setPiece(row, col, piece) {
        if (row >= 0 && row <= 7 && col >= 0 && col <= 7) {
            this.board[row][col] = piece;
        }
    }

    isWhitePiece(piece) {
        return piece === piece.toUpperCase();
    }

    isBlackPiece(piece) {
        return piece === piece.toLowerCase() && piece !== '';
    }

    getPieceColor(piece) {
        if (!piece) return null;
        return this.isWhitePiece(piece) ? 'white' : 'black';
    }

    isValidPosition(row, col) {
        return row >= 0 && row <= 7 && col >= 0 && col <= 7;
    }

    makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        const capturedPiece = this.getPiece(toRow, toCol);
        
        // Handle captures
        if (capturedPiece) {
            const captorColor = this.getPieceColor(piece);
            this.capturedPieces[captorColor].push(capturedPiece);
        }

        // Handle en passant capture
        if (piece.toLowerCase() === 'p' && this.enPassantTarget) {
            if (toRow === this.enPassantTarget.row && toCol === this.enPassantTarget.col) {
                const capturedPawnRow = this.currentTurn === 'white' ? toRow + 1 : toRow - 1;
                const capturedPawn = this.getPiece(capturedPawnRow, toCol);
                if (capturedPawn) {
                    this.capturedPieces[this.currentTurn].push(capturedPawn);
                    this.setPiece(capturedPawnRow, toCol, '');
                }
            }
        }

        // Reset en passant
        this.enPassantTarget = null;

        // Check for pawn double move (set en passant target)
        if (piece.toLowerCase() === 'p') {
            if (Math.abs(fromRow - toRow) === 2) {
                this.enPassantTarget = {
                    row: this.currentTurn === 'white' ? fromRow - 1 : fromRow + 1,
                    col: fromCol
                };
            }
        }

        // Handle castling
        if (piece.toLowerCase() === 'k' && Math.abs(fromCol - toCol) === 2) {
            if (toCol === 6) {
                const rook = this.getPiece(fromRow, 7);
                this.setPiece(fromRow, 7, '');
                this.setPiece(fromRow, 5, rook);
            } else if (toCol === 2) {
                const rook = this.getPiece(fromRow, 0);
                this.setPiece(fromRow, 0, '');
                this.setPiece(fromRow, 3, rook);
            }
        }

        // Track king and rook movements
        if (piece === 'K') this.whiteKingMoved = true;
        if (piece === 'k') this.blackKingMoved = true;
        if (piece === 'R') {
            if (fromRow === 7 && fromCol === 0) this.whiteRooksMoved.left = true;
            if (fromRow === 7 && fromCol === 7) this.whiteRooksMoved.right = true;
        }
        if (piece === 'r') {
            if (fromRow === 0 && fromCol === 0) this.blackRooksMoved.left = true;
            if (fromRow === 0 && fromCol === 7) this.blackRooksMoved.right = true;
        }

        // Make the move
        this.setPiece(toRow, toCol, piece);
        this.setPiece(fromRow, fromCol, '');

        // Handle pawn promotion
        if (piece.toLowerCase() === 'p') {
            if ((this.currentTurn === 'white' && toRow === 0) || 
                (this.currentTurn === 'black' && toRow === 7)) {
                this.setPiece(toRow, toCol, this.currentTurn === 'white' ? 'Q' : 'q');
            }
        }

        // Record move
        this.lastMove = { fromRow, fromCol, toRow, toCol };
        const files = 'abcdefgh';
        const ranks = '87654321';
        const notation = files[fromCol] + ranks[fromRow] + files[toCol] + ranks[toRow];
        
        this.moveHistory.push({
            piece,
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            captured: capturedPiece,
            notation: notation,
            fen: this.toFEN()
        });

        // Switch turns
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        
        // Save to localStorage
        this.saveToStorage();
    }

    undoLastMove() {
        if (this.moveHistory.length === 0) return false;
        
        // Remove last move
        this.moveHistory.pop();
        
        // Restore to previous state
        if (this.moveHistory.length > 0) {
            const previousMove = this.moveHistory[this.moveHistory.length - 1];
            this.loadFEN(previousMove.fen);
        } else {
            // Reset to initial position
            this.reset();
            this.gameStarted = true;
        }
        
        // Rebuild captured pieces from history
        this.capturedPieces = { white: [], black: [] };
        for (const move of this.moveHistory) {
            if (move.captured) {
                const captorColor = this.getPieceColor(move.piece);
                this.capturedPieces[captorColor].push(move.captured);
            }
        }
        
        this.selectedSquare = null;
        this.validMoves = [];
        
        // Save to localStorage
        this.saveToStorage();
        
        return true;
    }

    findKing(color) {
        const king = color === 'white' ? 'K' : 'k';
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.getPiece(row, col) === king) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    render(boardElement) {
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'square';
                square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
                square.dataset.row = row;
                square.dataset.col = col;

                const piece = this.getPiece(row, col);
                if (piece) {
                    square.textContent = PIECES[piece];
                }

                if (this.selectedSquare && 
                    this.selectedSquare.row === row && 
                    this.selectedSquare.col === col) {
                    square.classList.add('selected');
                }

                if (this.validMoves.some(move => move.row === row && move.col === col)) {
                    square.classList.add('valid-move');
                    if (this.getPiece(row, col)) {
                        square.classList.add('valid-capture');
                    }
                }

                if (this.lastMove) {
                    if ((this.lastMove.fromRow === row && this.lastMove.fromCol === col) ||
                        (this.lastMove.toRow === row && this.lastMove.toCol === col)) {
                        square.classList.add('last-move');
                    }
                }

                boardElement.appendChild(square);
            }
        }
    }

    clone() {
        const cloned = new ChessBoard();
        cloned.board = JSON.parse(JSON.stringify(this.board));
        cloned.currentTurn = this.currentTurn;
        cloned.whiteKingMoved = this.whiteKingMoved;
        cloned.blackKingMoved = this.blackKingMoved;
        cloned.whiteRooksMoved = { ...this.whiteRooksMoved };
        cloned.blackRooksMoved = { ...this.blackRooksMoved };
        cloned.enPassantTarget = this.enPassantTarget ? { ...this.enPassantTarget } : null;
        return cloned;
    }
}
