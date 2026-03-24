class AIEngine {
  // TSP implementation to find the optimal targeting path for movement efficiency
  static solveTSP(startPoint, targets) {
    if (targets.length === 0) return [];
    
    let bestPath = null;
    let minDistance = Infinity;
    
    const calculateDistance = (p1, p2) => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
    
    const permute = (arr, currentPath, currentDist, currentPos) => {
      if (arr.length === 0) {
        if (currentDist < minDistance) {
          minDistance = currentDist;
          bestPath = [...currentPath];
        }
        return;
      }
      for (let i = 0; i < arr.length; i++) {
        let nextNode = arr[i];
        let dist = calculateDistance(currentPos, nextNode);
        if (currentDist + dist >= minDistance) continue; // Basic pruning
        
        let remaining = arr.filter((_, idx) => idx !== i);
        currentPath.push(nextNode);
        permute(remaining, currentPath, currentDist + dist, nextNode);
        currentPath.pop();
      }
    };
    
    permute(targets, [], 0, startPoint);
    return bestPath;
  }

  // Heuristic: Net HP differential
  static evaluateState(state) {
    let aiHp = state.units.filter(u => u.team === 'ai').reduce((sum, u) => sum + u.hp, 0);
    let playerHp = state.units.filter(u => u.team === 'player').reduce((sum, u) => sum + u.hp, 0);
    return aiHp - playerHp;
  }

  // Generate tactical variations to evaluate
  static generateMoves(state, team) {
    const teamUnits = state.units.filter(u => u.team === team && u.hp > 0);
    const enemies = state.units.filter(u => u.team !== team && u.hp > 0);
    if (teamUnits.length === 0 || enemies.length === 0) return [state];

    let possibleStates = [];

    // Strategy 1: TSP Optimization (Focus on optimal pathing)
    let s1 = JSON.parse(JSON.stringify(state));
    for (let u of s1.units.filter(unit => unit.team === team && unit.hp > 0)) {
        let myEnemies = s1.units.filter(en => en.team !== team && en.hp > 0);
        if(myEnemies.length === 0) break;
        
        const path = this.solveTSP({x: u.x, y: u.y}, myEnemies);
        let target = path[0];
        this.executeIntent(u, target);
    }
    s1.units = s1.units.filter(u => u.hp > 0);
    possibleStates.push(s1);

    // Strategy 2: Focus Fire (All target the weakest enemy)
    let s2 = JSON.parse(JSON.stringify(state));
    let weakestEnemy = [...s2.units].filter(en => en.team !== team && en.hp > 0).sort((a,b) => a.hp - b.hp)[0];
    if(weakestEnemy) {
        for (let u of s2.units.filter(unit => unit.team === team && unit.hp > 0)) {
            this.executeIntent(u, weakestEnemy);
        }
    }
    s2.units = s2.units.filter(u => u.hp > 0);
    possibleStates.push(s2);

    // Strategy 3: Nearest Neighbor (Greedy Attack)
    let s3 = JSON.parse(JSON.stringify(state));
    for (let u of s3.units.filter(unit => unit.team === team && unit.hp > 0)) {
        let myEnemies = s3.units.filter(en => en.team !== team && en.hp > 0);
        if(myEnemies.length === 0) break;
        let nearest = myEnemies.map(en => ({en, dist: Math.abs(u.x - en.x) + Math.abs(u.y - en.y)})).sort((a,b)=>a.dist - b.dist)[0].en;
        this.executeIntent(u, nearest);
    }
    s3.units = s3.units.filter(u => u.hp > 0);
    possibleStates.push(s3);

    return possibleStates;
  }

  static executeIntent(unit, target) {
      const dist = Math.abs(unit.x - target.x) + Math.abs(unit.y - target.y);
      if (dist <= unit.range) {
          target.hp -= unit.attack;
          unit.action = 'attack';
      } else {
          // move 1 step towards target
          if (unit.x < target.x) unit.x += 1;
          else if (unit.x > target.x) unit.x -= 1;
          else if (unit.y < target.y) unit.y += 1;
          else if (unit.y > target.y) unit.y -= 1;
          unit.action = 'move';
      }
  }

  // Minimax with Alpha-Beta Pruning
  static minimax(state, depth, alpha, beta, maximizingPlayer) {
    if (depth === 0) return { score: this.evaluateState(state), state: state };
    
    let isGameOver = state.units.filter(u => u.team === 'ai').length === 0 || state.units.filter(u => u.team === 'player').length === 0;
    if (isGameOver) return { score: this.evaluateState(state), state: state };

    if (maximizingPlayer) {
      let maxEval = -Infinity;
      let bestState = null;
      let possibleMoves = this.generateMoves(state, 'ai');
      
      for (const nextState of possibleMoves) {
        let ev = this.minimax(nextState, depth - 1, alpha, beta, false).score;
        if (ev > maxEval) {
            maxEval = ev;
            bestState = nextState;
        }
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break; // Pruning
      }
      return { score: maxEval, state: bestState };
    } else {
      let minEval = Infinity;
      let bestState = null;
      let possibleMoves = this.generateMoves(state, 'player');
      
      for (const nextState of possibleMoves) {
        let ev = this.minimax(nextState, depth - 1, alpha, beta, true).score;
        if (ev < minEval) {
            minEval = ev;
            bestState = nextState;
        }
        beta = Math.min(beta, ev);
        if (beta <= alpha) break; // Pruning
      }
      return { score: minEval, state: bestState };
    }
  }

  static getBestMove(initialState) {
    // Simulate 4 half-turns ahead (2 full AI-Player turns)
    const result = this.minimax(initialState, 4, -Infinity, Infinity, true);
    // Return just the immediate next state selected by the algorithm
    return result.state;
  }
}

module.exports = AIEngine;
