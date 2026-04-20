import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function PaymentModal({ slotIndex, onClose }) {
  const { state, payPhasedInstallment, showToast } = useGame();
  
  const card = state.agendaSlots[slotIndex];
  
  if (!card || card.status !== 'building' || card.buildType !== 'phased') {
    onClose();
    return null;
  }

  const [amount, setAmount] = useState(1);
  const maxAffordable = Math.min(state.budget, card.remainingBalance);

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="gov-modal gov-modal--dilemma w-full max-w-sm">
        <div className="gov-modal-scan" />
        
        <div className="text-center pb-3 border-b border-indigo-500/30">
          <div className="gov-modal-top gov-heading text-indigo-400">PHASED CONSTRUCTION</div>
          <h2 className="gov-modal-title gov-heading mt-1">{card.name}</h2>
          <p className="gov-modal-sub mt-2">
            Remaining Balance: <span className="text-amber-300 font-bold">{card.remainingBalance}💰</span>
          </p>
        </div>

        <div className="py-6 flex flex-col items-center">
          <p className="text-xs text-slate-300 mb-3 tracking-wider">SELECT PAYMENT AMOUNT:</p>
          <div className="flex items-center gap-4 bg-black/40 p-2 rounded-xl border border-indigo-500/20">
            <button 
              className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded text-xl text-white"
              onClick={() => setAmount(Math.max(1, amount - 1))}
            >-</button>
            <span className="text-white font-mono text-2xl w-8 text-center">{amount}</span>
            <button 
              className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded text-xl text-white"
              onClick={() => setAmount(Math.min(maxAffordable, amount + 1))}
            >+</button>
          </div>
        </div>

        <div className="mt-2 flex justify-between items-center bg-black/25 border border-slate-700/40 rounded-xl p-2 mb-4">
          <span className="text-[11px] text-slate-300/60 uppercase tracking-widest" style={{ fontFamily: "var(--font-display)" }}>
            Available Budget
          </span>
          <span className="text-amber-300 font-black text-xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "0.08em" }}>
            {state.budget}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              if (state.budget < amount) {
                showToast('Not enough budget!', 'error');
              } else if (amount > card.remainingBalance) {
                 showToast('Payment exceeds remaining balance!', 'error');
              } else {
                payPhasedInstallment(slotIndex, amount);
                onClose();
              }
            }}
            disabled={amount < 1 || state.budget < amount}
            className={`py-3 w-full text-center rounded-lg border text-sm font-bold tracking-widest transition-colors ${amount >= 1 && state.budget >= amount ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(79,70,229,0.5)] hover:bg-indigo-500' : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'}`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            PAY {amount}💰
          </button>
          
          <button
            onClick={onClose}
            className="py-2 text-xs text-slate-300/50 hover:text-white hover:bg-white/5 uppercase tracking-widest border border-transparent hover:border-slate-600/30 transition-colors rounded-xl flex-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
