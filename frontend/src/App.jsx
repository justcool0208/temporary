import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, RotateCcw, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_STATE = {
  gridSize: 10,
  units: [
    { id: 'p1', team: 'player', x: 2, y: 3, hp: 100, maxHp: 100, attack: 25, range: 1, type: 'knight' },
    { id: 'p2', team: 'player', x: 2, y: 6, hp: 80, maxHp: 80, attack: 35, range: 3, type: 'archer' },
    { id: 'p3', team: 'player', x: 4, y: 5, hp: 120, maxHp: 120, attack: 15, range: 1, type: 'golem' },
    { id: 'a1', team: 'ai', x: 8, y: 2, hp: 120, maxHp: 120, attack: 15, range: 1, type: 'tank' },
    { id: 'a2', team: 'ai', x: 7, y: 5, hp: 90, maxHp: 90, attack: 30, range: 2, type: 'mage' },
    { id: 'a3', team: 'ai', x: 8, y: 8, hp: 70, maxHp: 70, attack: 40, range: 3, type: 'sniper' },
  ]
};

function App() {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [isBattling, setIsBattling] = useState(false);
  const [logs, setLogs] = useState(["System initialized. Click any cell to place/remove player units. Awaiting battle command..."]);
  const [metrics, setMetrics] = useState(null);

  const addLog = (msg) => {
    setLogs(prev => {
        const next = [msg, ...prev];
        return next.slice(0, 15);
    });
  };

  const handleCellClick = (x, y) => {
    if (isBattling) return;
    setGameState(prev => {
      const unitIdx = prev.units.findIndex(u => u.x === x && u.y === y);
      let newUnits = [...prev.units];
      if (unitIdx !== -1) {
        if (newUnits[unitIdx].team === 'player') {
          newUnits.splice(unitIdx, 1);
        }
      } else {
        newUnits.push({
          id: 'p' + Date.now(),
          team: 'player', x, y, hp: 100, maxHp: 100, attack: 25, range: 1, type: 'knight'
        });
      }
      return { ...prev, units: newUnits };
    });
  };

  const resolvePlayerMove = (state) => {
    let newState = JSON.parse(JSON.stringify(state));
    for (let u of newState.units.filter(unit => unit.team === 'player' && unit.hp > 0)) {
        let enemies = newState.units.filter(en => en.team === 'ai' && en.hp > 0);
        if (enemies.length === 0) continue;
        
        let nearest = enemies.sort((a,b) => (Math.abs(u.x - a.x) + Math.abs(u.y - a.y)) - (Math.abs(u.x - b.x) + Math.abs(u.y - b.y)))[0];
        let dist = Math.abs(u.x - nearest.x) + Math.abs(u.y - nearest.y);
        
        if (dist <= u.range) {
            nearest.hp -= u.attack;
        } else {
            if (u.x < nearest.x) u.x += 1;
            else if (u.x > nearest.x) u.x -= 1;
            else if (u.y < nearest.y) u.y += 1;
            else if (u.y > nearest.y) u.y -= 1;
        }
    }
    newState.units = newState.units.filter(u => u.hp > 0);
    return newState;
  };

  const executeTurn = async () => {
    if (!isBattling) return;

    try {
        let stateAfterPlayer = resolvePlayerMove(gameState);
        setGameState(stateAfterPlayer);
        
        const aiUnitsLeft = stateAfterPlayer.units.filter(u => u.team === 'ai').length;
        const playerUnitsLeft = stateAfterPlayer.units.filter(u => u.team === 'player').length;

        if (aiUnitsLeft === 0) {
            addLog("🎉 Player Wins! AI forces eliminated.");
            setIsBattling(false);
            return;
        }
        if (playerUnitsLeft === 0) {
            addLog("☠️ AI Wins! Player forces decimated.");
            setIsBattling(false);
            return;
        }

        const res = await axios.post('http://localhost:5000/api/ai/move', { gameState: stateAfterPlayer });
        
        setGameState(res.data.nextState);
        setMetrics(res.data.metrics);
        addLog(`AI executed optimal strategy in ${res.data.metrics.timeTakenMs}ms.`);

    } catch (err) {
        addLog(`Error syncing with AI Engine: ${err.message}`);
        setIsBattling(false);
    }
  };

  useEffect(() => {
    let interval;
    if (isBattling) {
      interval = setInterval(executeTurn, 1800);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBattling, gameState]);

  const toggleBattle = () => {
    setIsBattling(!isBattling);
    if (!isBattling) addLog("Battle simulation started.");
    else addLog("Battle paused by commander.");
  };

  const resetBattle = () => {
    setGameState(INITIAL_STATE);
    setIsBattling(false);
    setLogs(["System reset. Click any cell to place/remove player units. Simulation ready."]);
    setMetrics(null);
  };

  return (
    <div className="battlemind-container">
      <div className="header">
        <h1>BattleMind AI</h1>
        <p className="subtitle">Real-time Game Strategy Engine</p>
      </div>

      <div className="dashboard">
        <div className="glass-panel controls">
          <h3>Command Center</h3>
          <button className="btn" onClick={toggleBattle} style={{marginBottom: '10px'}}>
            {isBattling ? <Shield size={18} style={{marginRight: '8px'}}/> : <Play size={18} style={{marginRight: '8px'}}/>}
            {isBattling ? "Pause Sim" : "Start Sim"}
          </button>
          <button className="btn" onClick={resetBattle} style={{borderColor: '#ff4c4c', color: '#ff4c4c'}}>
            <RotateCcw size={18} style={{marginRight: '8px'}}/>
            Reset Board
          </button>

          {metrics && (
             <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} style={{marginTop: '25px', padding: '15px', background: 'rgba(69, 162, 158, 0.1)', borderRadius: '8px', border: '1px solid rgba(69, 162, 158, 0.3)'}}>
                 <h4 className="highlight">🧠 Core Analytics</h4>
                 <p style={{fontSize: '0.95rem', marginTop: '10px'}}>Computation Latency: <br/><b style={{fontSize: '1.2rem'}}>{metrics.timeTakenMs} ms</b></p>
                 <p style={{fontSize: '0.9rem', marginTop: '8px', color: '#66fcf1'}}>{metrics.algorithm}</p>
             </motion.div>
          )}

          <div style={{marginTop: 'auto', paddingTop: '20px'}}>
            <h4 style={{marginBottom: '10px', color: '#c5c6c7'}}>Activity Feed</h4>
            <div className="log-panel">
               <AnimatePresence>
                 {logs.map((log, idx) => (
                    <motion.div key={idx} initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} className="log-entry" style={{color: log.includes('AI Wins') ? '#ff4c4c' : log.includes('Player Wins') ? '#66fcf1' : '#a8b2d1'}}>
                        {log}
                    </motion.div>
                 ))}
               </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
           <div className="battlefield">
              {Array.from({length: 100}).map((_, idx) => {
                  const x = idx % 10;
                  const y = Math.floor(idx / 10);
                  const unit = gameState.units.find(u => u.x === x && u.y === y);
                  
                  return (
                      <div key={idx} className="cell" onClick={() => handleCellClick(x, y)} style={{ cursor: isBattling ? 'default' : 'pointer' }}>
                          {unit && (
                              <motion.div 
                                layoutId={unit.id}
                                className={`unit ${unit.team}`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              >
                                  {unit.type[0].toUpperCase()}
                                  <div className="unit-hp">{unit.hp}/{unit.maxHp}</div>
                              </motion.div>
                          )}
                      </div>
                  );
              })}
           </div>
        </div>
        
        <div className="glass-panel" style={{maxWidth: '280px'}}>
             <h3>Live Statistics</h3>
             <div style={{marginTop: '20px'}}>
                 <h4 className="highlight">Player Output</h4>
                 <p style={{fontSize: '1.4rem'}}>{gameState.units.filter(u=>u.team === 'player').length} <span style={{fontSize:'0.9rem'}}>Units Active</span></p>
                 <div style={{height: '1px', background: 'rgba(255,255,255,0.1)', margin: '15px 0'}}></div>
                 <h4 className="danger">AI Execution</h4>
                 <p style={{fontSize: '1.4rem'}}>{gameState.units.filter(u=>u.team === 'ai').length} <span style={{fontSize:'0.9rem'}}>Units Active</span></p>
             </div>
             
             <div style={{marginTop: 'auto', padding: '15px', background: '#121212', borderRadius: '8px', border: '1px solid #333', fontSize: '0.85rem', color: '#8892b0'}}>
                 <b style={{color: '#fff', fontSize: '0.95rem'}}>System Architecture</b>
                 <ul style={{marginLeft: '20px', marginTop: '10px', display: 'flex', flexDirection:'column', gap: '8px'}}>
                     <li><b>Minimax:</b> Game theory decision engine calculating future states.</li>
                     <li><b>Alpha-Beta:</b> Pruning suboptimal pathways to minimize tree complexity.</li>
                     <li><b>TSP:</b> Travel cost optimization mapping for lowest latency multi-target action.</li>
                 </ul>
             </div>
        </div>

      </div>
    </div>
  );
}

export default App;
