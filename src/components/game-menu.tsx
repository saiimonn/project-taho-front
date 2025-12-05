interface GameMenuProps {
  status: "menu" | "paused" | "gameover" | "victory"
  score: number
  highScore: number
  onStart: () => void
  onResume?: () => void
}

export function GameMenu({ status, score, highScore, onStart, onResume }: GameMenuProps) {
  return(
    <div className = "absolute inset-0 bg-black/85 flex flex-col items-center justify-center z-10">
      {status === "menu" && (
        <>
          <div className = "mb-8 text-center">
            <h1 className = "text-[28px] text-touhou-pink-dim mb-2 font-serif">東方永夜抄</h1>
            <p className = "text-xs text-touhou-pink-dim/60 italic">~ Imperishable Night</p>
          </div>
          
          <div className = "text-center mb-6">
            <p className = "text-touhou-text-dim text-[11px]">HIGH SCORE</p>
            <p className="text-touhou-text text-sm tracking-widest">{ highScore.toString().padStart(10, "0") }</p>
          </div>
          
          <div className = "text-center">
            <button
              onClick={onStart}
              className = "block w-[180px] py-2 px-4 text-sm text-touhou-pink-dim bg-transparent border-none cursor-pointer mb-1 hover:text-touhou-text transition-colors"
            >
              Start Game
            </button>
            
            <div className = "text-touhou-text-dark text-[11px] py-2 px-4">Extra Start</div>
            <div className = "text-touhou-text-dark text-[11px] py-2 px-4">Practice Start</div>
            <div className = "text-touhou-text-dark text-[11px] py-2 px-4">Spell Practice</div>
          </div>
          
          <p className = "text-[10px] text-touhou-text-dark mt-8">Arrow keys to move | Z to shoot | X for bomb</p>
        </>
      )}
      
      {status === "paused" && (
        <>
          <h2 className="text-xl text-touhou-pink-dim mb-6">PAUSED</h2>
          <button
            onClick={onResume}
            className="block w-40 py-2 px-4 text-sm text-touhou-pink-dim bg-transparent border-none cursor-pointer mb-2 hover:text-touhou-text transition-colors"
          >
            Resume
          </button>
          <button
            onClick={onStart}
            className="block w-40 py-2 px-4 text-sm text-touhou-text-dim bg-transparent border-none cursor-pointer hover:text-touhou-text transition-colors"
          >
            Restart
          </button>
        </>
      )}
      
      {status === "gameover" && (
        <>
          <h2 className="text-xl text-touhou-red mb-4">GAME OVER</h2>
          <div className="text-center mb-6">
            <p className="text-touhou-text-dim text-[11px]">FINAL SCORE</p>
            <p className="text-touhou-text text-lg tracking-widest">{score.toString().padStart(10, "0")}</p>
          </div>
          {score >= highScore && score > 0 && <p className="text-touhou-yellow text-sm mb-4">NEW HIGH SCORE!</p>}
          <button
            onClick={onStart}
            className="w-40 py-2 px-4 text-sm text-touhou-pink-dim bg-transparent border-none cursor-pointer hover:text-touhou-text transition-colors"
          >
            Continue?
          </button>
        </>
      )}
      
      {status === "victory" && (
        <>
          <h2 className="text-xl text-touhou-yellow mb-2">ALL CLEAR!</h2>
          <p className="text-touhou-pink-dim/60 text-[11px] mb-4">永夜を解き明かした</p>
          <div className="text-center mb-6">
            <p className="text-touhou-text-dim text-[11px]">FINAL SCORE</p>
            <p className="text-touhou-text text-lg tracking-widest">{score.toString().padStart(10, "0")}</p>
          </div>
          {score >= highScore && <p className="text-touhou-yellow text-sm mb-4">NEW HIGH SCORE!</p>}
          <button
            onClick={onStart}
            className="w-40 py-2 px-4 text-sm text-touhou-pink-dim bg-transparent border-none cursor-pointer hover:text-touhou-text transition-colors"
          >
            Play Again
          </button>
        </>
      )}
    </div>
  )
}