class ChessRules {
    constructor(board) {
        this.board = board;
    }

    getPossibleMoves(row, col) {
        const piece = this.board.getPiece(row, col);
        if (!piece) return [];

        const pieceLower = piece.toLowerCase();
        let moves = [];

        switch (pieceLower) {
            case 'p':
                moves = this.getPawnMoves(row, col, piece);
                break;
            case 'n':
                moves = this.getKnightMoves(row, col, piece);
                break;
            case 'b':
                moves = this.getBishopMoves(row, col, piece);
                break;
            case 'r':
                moves = this.getRookMoves(row, col, piece);
                break;
            case 'q':
                moves = this.getQueenMoves(row, col, piece);
                break;
            case 'k':
                moves = this.getKingMoves(row, col, piece);
                break;
        }

        return moves;
    }

    getLegalMoves(row, col) {
        const possibleMoves = this.getPossibleMoves(row, col);
        const legalMoves = [];

        for (const move of possibleMoves) {
            if (this.isMoveLegal(row, col, move.row, move.col)) {
                legalMoves.push(move);
            }
        }

        return legalMoves;
    }

    // isMoveLegal(fromRow, fromCol, toRow, toCol) {
    //     const testBoard = this.board.clone();
    //     const piece = testBoard.getPiece(fromRow, fromCol);
    //     const color = testBoard.getPieceColor(piece);

    //     testBoard.setPiece(toRow, toCol, piece);
    //     testBoard.setPiece(fromRow, fromCol, '');

    //     const testRules = new ChessRules(testBoard);
    //     return !testRules.isKingInCheck(color);
    // }

    isMoveLegal(fromRow, fromCol, toRow, toCol) {
    const testBoard = this.board.clone();
    const piece = testBoard.getPiece(fromRow, fromCol);
    const color = testBoard.getPieceColor(piece);

    testBoard.setPiece(toRow, toCol, piece);
    testBoard.setPiece(fromRow, fromCol, '');

    // ✅ SWITCH TURN ON TEST BOARD
    testBoard.currentTurn = color === 'white' ? 'black' : 'white';

    const testRules = new ChessRules(testBoard);
    return !testRules.isKingInCheck(color);
    }

    getPawnMoves(row, col, piece) {
        const moves = [];
        const isWhite = this.board.isWhitePiece(piece);
        const direction = isWhite ? -1 : 1;
        const startRow = isWhite ? 6 : 1;

        const newRow = row + direction;
        if (this.board.isValidPosition(newRow, col) && !this.board.getPiece(newRow, col)) {
            moves.push({ row: newRow, col });

            if (row === startRow) {
                const doubleRow = row + (2 * direction);
                if (!this.board.getPiece(doubleRow, col)) {
                    moves.push({ row: doubleRow, col });
                }
            }
        }

        for (const colOffset of [-1, 1]) {
            const captureCol = col + colOffset;
            if (this.board.isValidPosition(newRow, captureCol)) {
                const targetPiece = this.board.getPiece(newRow, captureCol);
                if (targetPiece && this.board.getPieceColor(targetPiece) !== (isWhite ? 'white' : 'black')) {
                    moves.push({ row: newRow, col: captureCol });
                }

                if (this.board.enPassantTarget) {
                    if (newRow === this.board.enPassantTarget.row && 
                        captureCol === this.board.enPassantTarget.col) {
                        moves.push({ row: newRow, col: captureCol });
                    }
                }
            }
        }

        return moves;
    }

    getKnightMoves(row, col, piece) {
        const moves = [];
        const color = this.board.getPieceColor(piece);
        const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];

        for (const [rowOffset, colOffset] of offsets) {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;

            if (this.board.isValidPosition(newRow, newCol)) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                if (!targetPiece || this.board.getPieceColor(targetPiece) !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        return moves;
    }

    getBishopMoves(row, col, piece) {
        return this.getSlidingMoves(row, col, piece, [
            [-1, -1], [-1, 1], [1, -1], [1, 1]
        ]);
    }

    getRookMoves(row, col, piece) {
        return this.getSlidingMoves(row, col, piece, [
            [-1, 0], [1, 0], [0, -1], [0, 1]
        ]);
    }

    getQueenMoves(row, col, piece) {
        return this.getSlidingMoves(row, col, piece, [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ]);
    }

    getSlidingMoves(row, col, piece, directions) {
        const moves = [];
        const color = this.board.getPieceColor(piece);

        for (const [rowDir, colDir] of directions) {
            let newRow = row + rowDir;
            let newCol = col + colDir;

            while (this.board.isValidPosition(newRow, newCol)) {
                const targetPiece = this.board.getPiece(newRow, newCol);

                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (this.board.getPieceColor(targetPiece) !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }

                newRow += rowDir;
                newCol += colDir;
            }
        }

        return moves;
    }

    getKingMoves(row, col, piece) {
        const moves = [];
        const color = this.board.getPieceColor(piece);
        const offsets = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1], [0, 1],
            [1, -1], [1, 0], [1, 1]
        ];

        for (const [rowOffset, colOffset] of offsets) {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;

            if (this.board.isValidPosition(newRow, newCol)) {
                const targetPiece = this.board.getPiece(newRow, newCol);
                if (!targetPiece || this.board.getPieceColor(targetPiece) !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }

        // Castling
        if (color === 'white' && !this.board.whiteKingMoved && !this.isKingInCheck('white')) {
            if (!this.board.whiteRooksMoved.right &&
                !this.board.getPiece(7, 5) && !this.board.getPiece(7, 6) &&
                !this.isSquareAttacked(7, 5, 'black') && !this.isSquareAttacked(7, 6, 'black')) {
                moves.push({ row: 7, col: 6 });
            }
            if (!this.board.whiteRooksMoved.left &&
                !this.board.getPiece(7, 1) && !this.board.getPiece(7, 2) && !this.board.getPiece(7, 3) &&
                !this.isSquareAttacked(7, 2, 'black') && !this.isSquareAttacked(7, 3, 'black')) {
                moves.push({ row: 7, col: 2 });
            }
        }

        if (color === 'black' && !this.board.blackKingMoved && !this.isKingInCheck('black')) {
            if (!this.board.blackRooksMoved.right &&
                !this.board.getPiece(0, 5) && !this.board.getPiece(0, 6) &&
                !this.isSquareAttacked(0, 5, 'white') && !this.isSquareAttacked(0, 6, 'white')) {
                moves.push({ row: 0, col: 6 });
            }
            if (!this.board.blackRooksMoved.left &&
                !this.board.getPiece(0, 1) && !this.board.getPiece(0, 2) && !this.board.getPiece(0, 3) &&
                !this.isSquareAttacked(0, 2, 'white') && !this.isSquareAttacked(0, 3, 'white')) {
                moves.push({ row: 0, col: 2 });
            }
        }

        return moves;
    }

    // isSquareAttacked(row, col, byColor) {
    //     for (let r = 0; r < 8; r++) {
    //         for (let c = 0; c < 8; c++) {
    //             const piece = this.board.getPiece(r, c);
    //             if (piece && this.board.getPieceColor(piece) === byColor) {
    //                 const moves = this.getPossibleMoves(r, c);
    //                 if (moves.some(move => move.row === row && move.col === col)) {
    //                     return true;
    //                 }
    //             }
    //         }
    //     }
    //     return false;
    // }

    isSquareAttacked(row, col, byColor) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = this.board.getPiece(r, c);
            if (!piece) continue;

            if (this.board.getPieceColor(piece) !== byColor) continue;

            const pieceType = piece.toLowerCase();

            let moves = [];

            // ❗ IMPORTANT: NO KING MOVES HERE
            switch (pieceType) {
                case 'p':
                    moves = this.getPawnAttackMoves(r, c, piece);
                    break;
                case 'n':
                    moves = this.getKnightMoves(r, c, piece);
                    break;
                case 'b':
                    moves = this.getBishopMoves(r, c, piece);
                    break;
                case 'r':
                    moves = this.getRookMoves(r, c, piece);
                    break;
                case 'q':
                    moves = this.getQueenMoves(r, c, piece);
                    break;
                case 'k':
                    moves = this.getKingAttackMoves(r, c);
                    break;
            }

            if (moves.some(m => m.row === row && m.col === col)) {
                return true;
            }
        }
    }
    return false;
}

getPawnAttackMoves(row, col, piece) {
    const moves = [];
    const isWhite = this.board.isWhitePiece(piece);
    const dir = isWhite ? -1 : 1;

    for (const dc of [-1, 1]) {
        const r = row + dir;
        const c = col + dc;
        if (this.board.isValidPosition(r, c)) {
            moves.push({ row: r, col: c });
        }
    }
    return moves;
}

getKingAttackMoves(row, col) {
    const moves = [];
    const dirs = [
        [-1,-1],[-1,0],[-1,1],
        [0,-1],        [0,1],
        [1,-1],[1,0],[1,1]
    ];

    for (const [dr, dc] of dirs) {
        const r = row + dr;
        const c = col + dc;
        if (this.board.isValidPosition(r, c)) {
            moves.push({ row: r, col: c });
        }
    }
    return moves;
}





//above code

    isKingInCheck(color) {
        const kingPos = this.board.findKing(color);
        if (!kingPos) return false;

        const opponentColor = color === 'white' ? 'black' : 'white';
        return this.isSquareAttacked(kingPos.row, kingPos.col, opponentColor);
    }

    getAllLegalMoves(color) {
        const allMoves = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board.getPiece(row, col);
                if (piece && this.board.getPieceColor(piece) === color) {
                    const legalMoves = this.getLegalMoves(row, col);
                    if (legalMoves.length > 0) {
                        allMoves.push({
                            from: { row, col },
                            moves: legalMoves
                        });
                    }
                }
            }
        }

        return allMoves;
    }

    // CHECKMATE: King is in check AND has no legal moves
    isCheckmate(color) {
        if (!this.isKingInCheck(color)) {
            return false;
        }
        const allMoves = this.getAllLegalMoves(color);
        return allMoves.length === 0;
    }

    // STALEMATE: King is NOT in check BUT has no legal moves
    isStalemate(color) {
        if (this.isKingInCheck(color)) {
            return false;
        }
        const allMoves = this.getAllLegalMoves(color);
        return allMoves.length === 0;
    }

    getGameStatus() {
        const currentColor = this.board.currentTurn;

        if (this.isCheckmate(currentColor)) {
            return {
                status: 'checkmate',
                winner: currentColor === 'white' ? 'black' : 'white'
            };
        }

        if (this.isStalemate(currentColor)) {
            return {
                status: 'stalemate',
                winner: null
            };
        }

        if (this.isKingInCheck(currentColor)) {
            return {
                status: 'check',
                winner: null
            };
        }

        return {
            status: 'ongoing',
            winner: null
        };
    }
}
