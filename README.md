# ♟️ Live Chess - Two Player Game

A feature-rich, real-time multiplayer chess game built with vanilla JavaScript, Node.js, Express, and Socket.IO. Play chess with a friend in the same browser with full chess rules, move validation, and an elegant user interface.

![Chess Game](https://img.shields.io/badge/Game-Chess-blue)
![Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-ISC-yellow)

## ✨ Features

### Core Gameplay
- ✅ **Full Chess Rules Implementation**
  - All standard piece movements (Pawn, Knight, Bishop, Rook, Queen, King)
  - Special moves: Castling (Kingside & Queenside)
  - En Passant captures
  - Pawn promotion (auto-promotes to Queen)
  - Move validation and legal move highlighting

### Game States
- 🔍 **Check Detection** - Visual indication when king is in check
- 🏆 **Checkmate Detection** - Game ends when checkmate is achieved
- 🤝 **Stalemate Detection** - Recognizes draw conditions
- 📊 **Game Status Bar** - Real-time updates on game state

### User Interface
- 🎨 **Beautiful Gradient Design** - Modern purple gradient theme
- 💫 **Splash Screen Animation** - Animated intro screen
- 🎯 **Visual Move Indicators**
  - Selected piece highlighting
  - Valid move indicators (green dots)
  - Capture move highlighting (red border)
  - Last move tracking
  - Check highlighting (blinking red)

### Multiplayer Features
- 👥 **Two Player Support** - Play with custom player names
- 💬 **Real-time Chat** - Built-in chat system for players
- 🔄 **Live Game Sync** - Socket.IO powered real-time updates
- 📜 **Move History** - Complete game notation tracking
- 🎯 **Captured Pieces Display** - See all captured pieces

### Game Controls
- ⏮️ **Undo Move** - Take back your last move
- 🔄 **New Game** - Start fresh anytime
- 🏳️ **Quit Game** - End current game
- 💾 **Auto-save** - Game state persists in localStorage

### Technical Features
- 📝 **FEN Notation Support** - Import/export game states
- 🎲 **Game State Management** - Complete state tracking
- 📱 **Responsive Design** - Works on desktop and tablet
- 🚀 **Fast & Lightweight** - No heavy frameworks

## 🛠️ Technologies Used

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients, animations, flexbox
- **Vanilla JavaScript** - No frameworks, pure JS
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web server framework
- **Socket.IO** - WebSocket library for real-time features
- **HTTP** - Server creation

### Architecture
- **Object-Oriented Design** - ChessBoard and ChessRules classes
- **Event-Driven** - Socket.IO events for multiplayer
- **Modular Code** - Separated concerns (board, rules, main logic)

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Steps

1. **Clone or download the project**
   ```bash
   cd chess-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🎮 How to Play

### Starting a Game

1. **Enter Player Names**
   - Player 1 enters their name (plays as White)
   - Player 2 enters their name (plays as Black)

2. **Click "Start Game"**
   - The game board initializes
   - White makes the first move

### Making Moves

1. **Select a Piece**
   - Click on one of your pieces
   - Valid moves will be highlighted in green
   - Possible captures shown with red border

2. **Make Your Move**
   - Click on a highlighted square to move
   - The turn automatically switches to the other player

3. **Special Moves**
   - **Castling**: Move king two squares toward rook (if conditions met)
   - **En Passant**: Capture pawn that just moved two squares
   - **Promotion**: Pawns reaching the end auto-promote to Queen

### Game Controls

- **⏮️ Undo**: Take back the last move
- **🏳️ Quit**: End the current game
- **🔄 New Game**: Start a fresh game
- **💬 Chat**: Communicate with your opponent

### Winning Conditions

- **Checkmate**: Opponent's king is in check with no legal moves → You win!
- **Stalemate**: Opponent has no legal moves but isn't in check → Draw
- **Resignation**: Opponent quits → You win!

## 📁 Project Structure

```
chess-game/
│
├── index.html          # Main HTML file
├── server.js           # Express + Socket.IO server
├── package.json        # Node.js dependencies
│
├── css/
│   └── style.css      # All styling and animations
│
└── js/
    ├── board.js       # ChessBoard class (game state, FEN, rendering)
    ├── rules.js       # ChessRules class (move validation, check/mate)
    └── main.js        # Main game logic and event handlers
```

## 🎯 Key Classes

### ChessBoard (`board.js`)
- Manages board state and piece positions
- Handles FEN notation import/export
- Tracks move history and captured pieces
- Renders the board to DOM
- Manages game persistence (localStorage)

### ChessRules (`rules.js`)
- Calculates legal moves for each piece type
- Validates move legality (prevents moving into check)
- Detects check, checkmate, and stalemate
- Handles special moves (castling, en passant)
- Attack square calculation

### Main Game Logic (`main.js`)
- Handles user interactions
- Manages Socket.IO connections
- Controls game flow and turns
- Updates UI based on game state
- Chat functionality

## 🚀 Features in Detail

### Move Validation
- Pieces can only move according to chess rules
- Moves that would put own king in check are prevented
- Castling requirements checked (king/rook not moved, clear path, no check)
- En passant capture window tracked

### Check/Checkmate System
- Real-time check detection
- King square highlights in red when in check
- Checkmate ends the game immediately
- Stalemate correctly recognized as a draw

### Multiplayer Sync
- Socket.IO rooms for game sessions
- Real-time move broadcasting
- Chat messages synced across clients
- Game state shared between players

## 🔧 Configuration

### Port Configuration
The server runs on port 3000 by default. To change:

```javascript
// In server.js
const PORT = process.env.PORT || 3000; // Change 3000 to your preferred port
```

### Styling Customization
All colors and styles are in `css/style.css`:
- Board colors: `.square.light` and `.square.dark`
- Gradient theme: `background: linear-gradient(...)`
- Piece size: `.square { font-size: 50px; }`

## 🐛 Known Limitations

- Pawn promotion currently auto-promotes to Queen only
- No chess clock/timer implemented
- Single room ("chess_lobby") - all players join same game
- No game replay feature
- No draw by threefold repetition or 50-move rule

## 🔮 Future Enhancements

- [ ] Custom pawn promotion choice (Queen, Rook, Bishop, Knight)
- [ ] Chess timer/clock for timed games
- [ ] Multiple game rooms support
- [ ] AI opponent (computer player)
- [ ] Game save/load from files
- [ ] Move annotations and analysis
- [ ] Spectator mode
- [ ] ELO rating system
- [ ] Game replay and review
- [ ] Draw offers and resignation confirmations
- [ ] Sound effects for moves
- [ ] Drag-and-drop piece movement

## 📝 License

ISC License - Feel free to use and modify!

## 👨‍💻 Development

### Running in Development Mode
```bash
npm run dev
```
Uses `nodemon` for auto-restart on file changes.

### Testing
Open multiple browser tabs to simulate two players:
1. Tab 1: Enter Player 1 name
2. Tab 2: Enter Player 2 name
3. Click "Start Game" in either tab
4. Play moves alternately between tabs

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Better AI opponent
- Additional chess variants (Chess960, etc.)
- Mobile touch controls optimization
- Accessibility improvements
- Internationalization (i18n)

## 📞 Support

For issues or questions:
1. Check the code comments in the source files
2. Review the game rules implementation
3. Test in browser console for debugging

## 🎉 Credits

Built with ❤️ using:
- Chess piece Unicode symbols
- Socket.IO for real-time features
- Express.js for server
- Modern CSS gradients and animations

---

**Enjoy your game! ♟️**
