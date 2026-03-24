const express = require('express');
const cors = require('cors');
const AIEngine = require('./ai/engine');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/ai/move', (req, res) => {
    const gameState = req.body.gameState;
    
    const startTime = Date.now();
    
    // Evaluate and get the best AI move (which includes player state emulation)
    const nextState = AIEngine.getBestMove(gameState);
    
    const timeTakenMs = Date.now() - startTime;
    
    res.json({
        success: true,
        nextState: nextState,
        metrics: {
            timeTakenMs: timeTakenMs,
            algorithm: "Minimax + Alpha-Beta Pruning + TSP"
        }
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`BattleMind AI Backend running on port ${PORT}`);
});
