# BattleMind AI

BattleMind AI is a real-time game strategy engine and simulation. It demonstrates an advanced, full-stack approach to turn-based game logic and tactical decision-making, where an automated "Player" team battles against an intelligent "AI" team on a 10x10 strategic grid.

## 🎯 What is it about?
The project is built to visualize how game AI algorithms resolve complex combat scenarios. By pitting a simple greedy algorithm (the Player forces) against an advanced predictive algorithm (the AI forces), users can watch in real-time as the computer uses game theory heuristics to outmaneuver or eliminate the player's units.

The units belong to different archetypes (Knight, Archer, Golem, Tank, Mage, Sniper) with unique `hp`, `attack`, and `range` attributes, adding tactical depth to where they move and who they target.

## 🎮 How to play
BattleMind AI operates as an automated command simulation rather than a manually controlled game. 

1. **Launch the platform:** Ensure both your frontend React application and backend Node server are running.
2. **Command Center:** Open your browser to the web app (`http://localhost:5173`).
3. **Start the Simulation:** Click the **Start Sim** button on the left dashboard to initiate the battle. The state engine takes over, executing a cycle every 1800ms.
4. **Pause/Reset:** You can pause the simulation at any time by clicking **Pause Sim**, or hit the **Reset Board** button to restart the battle with the pristine initial unit placements.
5. **Observing the metrics:** Watch the *Activity Feed* for live simulation logs, and the *Core Analytics* panel to see exactly how quickly the AI computes its next optimal stratagem dynamically.

## ⚙️ How it works
The project features a **React (Vite)** frontend acting as the renderer and game loop orchestrator, and an **Express (Node.js)** backend serving as the heavy mathematical AI engine. 

### The Game Loop (Frontend)
During each turn cycle, the frontend calculates the Player's moves using a simplistic nearest-neighbor heuristic. Player units find the closest visible AI unit and either move exactly 1 Manhattan block towards them or deal damage if the enemy falls within their attack range.

Following the Player's move, the frontend packages the updated game state and sends a REST `POST` payload to the backend to get the precise AI response.

### The AI Architecture (Backend)
The backend intercepts the current game board matrix and feeds it into the **AIEngine**, which uses the following principles to secure victory:

- **Minimax Algorithm:** A recursive game theory decision engine. The AI simulates the board 4 half-turns into the future, predicting not only its own optimal plays but anticipating the Player's most destructive counter-attacks.
- **Alpha-Beta Pruning:** Because the search tree branches aggressively with every unit's possible movement, the engine aggressively prunes (skips) suboptimal branches, effectively keeping computation latency low (routinely under 2ms).
- **Targeting Strategies (TSP & Focus Fire):** The AI generates branches based on dynamic strategic intents: 
  - *TSP (Traveling Salesperson Problem)*-style pathing to plot efficient movement across multiple enemies.
  - *Focus Fire* targeting to aggressively eliminate the weakest player unit on the board.
- **State Evaluation:** The mathematical core of the AI measures the desirability of any simulated future state by analyzing the remaining net Health Points: `total AI HP - total Player HP`. By maximizing this differential, the AI guarantees that it deals the highest possible damage while avoiding taking hits itself.

## 🚀 Running the Project locally

**1. Start the Backend API (Port 5000)**
```bash
cd backend
npm install
npm start
```

**2. Start the Frontend Application**
```bash
cd frontend
npm install
npm run dev
```
