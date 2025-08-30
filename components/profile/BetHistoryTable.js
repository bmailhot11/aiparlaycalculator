import { useState } from 'react';
import { Edit3, Trash2, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function BetHistoryTable({ bets = [], onAddBet, onEditBet, onDeleteBet }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBet, setEditingBet] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sport: '',
    market: '',
    selection: '',
    odds: '',
    stake: '',
    result: 'pending',
    payout: ''
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      sport: '',
      market: '',
      selection: '',
      odds: '',
      stake: '',
      result: 'pending',
      payout: ''
    });
    setShowAddForm(false);
    setEditingBet(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const betData = {
      ...formData,
      id: editingBet?.id || Date.now(),
      stake: parseFloat(formData.stake),
      payout: formData.result === 'won' ? parseFloat(formData.payout) : 0,
      profit: formData.result === 'won' ? parseFloat(formData.payout) - parseFloat(formData.stake) : 
              formData.result === 'lost' ? -parseFloat(formData.stake) : 0
    };

    if (editingBet) {
      onEditBet(betData);
    } else {
      onAddBet(betData);
    }
    resetForm();
  };

  const handleEdit = (bet) => {
    setFormData({
      date: bet.date,
      sport: bet.sport,
      market: bet.market,
      selection: bet.selection,
      odds: bet.odds,
      stake: bet.stake.toString(),
      result: bet.result,
      payout: bet.payout?.toString() || ''
    });
    setEditingBet(bet);
    setShowAddForm(true);
  };

  const getResultIcon = (result, profit) => {
    if (result === 'won') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (result === 'lost') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getResultColor = (result) => {
    if (result === 'won') return 'text-green-400 bg-green-900/20';
    if (result === 'lost') return 'text-red-400 bg-red-900/20';
    return 'text-gray-400 bg-gray-900/20';
  };

  return (
    <div className="bg-[#141C28] border border-[#1F2937] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#E5E7EB]">Bet History</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-[#F4C430] text-[#0B0F14] px-4 py-2 rounded-lg font-medium hover:bg-[#e6b829] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Bet
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-[#0B0F14] border border-[#374151] rounded-lg">
          <h4 className="text-md font-medium text-[#E5E7EB] mb-4">
            {editingBet ? 'Edit Bet' : 'Add New Bet'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-3 py-2 bg-[#141C28] border border-[#374151] rounded text-[#E5E7EB] text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Sport</label>
                <input
                  type="text"
                  value={formData.sport}
                  onChange={(e) => setFormData({...formData, sport: e.target.value})}
                  className="w-full px-3 py-2 bg-[#141C28] border border-[#374151] rounded text-[#E5E7EB] text-sm"
                  placeholder="NBA, NFL, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Market</label>
                <input
                  type="text"
                  value={formData.market}
                  onChange={(e) => setFormData({...formData, market: e.target.value})}
                  className="w-full px-3 py-2 bg-[#141C28] border border-[#374151] rounded text-[#E5E7EB] text-sm"
                  placeholder="Moneyline, Spread, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Selection</label>
                <input
                  type="text"
                  value={formData.selection}
                  onChange={(e) => setFormData({...formData, selection: e.target.value})}
                  className="w-full px-3 py-2 bg-[#141C28] border border-[#374151] rounded text-[#E5E7EB] text-sm"
                  placeholder="Lakers -5.5, Over 220, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Odds</label>
                <input
                  type="text"
                  value={formData.odds}
                  onChange={(e) => setFormData({...formData, odds: e.target.value})}
                  className="w-full px-3 py-2 bg-[#141C28] border border-[#374151] rounded text-[#E5E7EB] text-sm"
                  placeholder="+150, -110, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Stake ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.stake}
                  onChange={(e) => setFormData({...formData, stake: e.target.value})}
                  className="w-full px-3 py-2 bg-[#141C28] border border-[#374151] rounded text-[#E5E7EB] text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">Result</label>
                <select
                  value={formData.result}
                  onChange={(e) => setFormData({...formData, result: e.target.value})}
                  className="w-full px-3 py-2 bg-[#141C28] border border-[#374151] rounded text-[#E5E7EB] text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              {formData.result === 'won' && (
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">Payout ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.payout}
                    onChange={(e) => setFormData({...formData, payout: e.target.value})}
                    className="w-full px-3 py-2 bg-[#141C28] border border-[#374151] rounded text-[#E5E7EB] text-sm"
                    required={formData.result === 'won'}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-[#F4C430] text-[#0B0F14] px-4 py-2 rounded font-medium hover:bg-[#e6b829] transition-colors"
              >
                {editingBet ? 'Update Bet' : 'Add Bet'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-[#374151] text-[#E5E7EB] px-4 py-2 rounded font-medium hover:bg-[#4B5563] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {bets.length === 0 ? (
        <div className="text-center py-8 text-[#9CA3AF]">
          <p className="mb-2">No bets recorded yet</p>
          <p className="text-sm">Add your first bet to start tracking your performance</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#374151]">
                <th className="text-left py-3 px-2 text-[#9CA3AF] font-medium">Date</th>
                <th className="text-left py-3 px-2 text-[#9CA3AF] font-medium">Sport</th>
                <th className="text-left py-3 px-2 text-[#9CA3AF] font-medium">Selection</th>
                <th className="text-left py-3 px-2 text-[#9CA3AF] font-medium">Odds</th>
                <th className="text-right py-3 px-2 text-[#9CA3AF] font-medium">Stake</th>
                <th className="text-center py-3 px-2 text-[#9CA3AF] font-medium">Result</th>
                <th className="text-right py-3 px-2 text-[#9CA3AF] font-medium">Profit</th>
                <th className="text-center py-3 px-2 text-[#9CA3AF] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bets.slice(0, 10).map((bet) => (
                <tr key={bet.id} className="border-b border-[#374151]/50 hover:bg-[#0B0F14]/50">
                  <td className="py-3 px-2 text-[#E5E7EB]">
                    {new Date(bet.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-3 px-2 text-[#E5E7EB]">{bet.sport}</td>
                  <td className="py-3 px-2 text-[#E5E7EB]">
                    <div className="max-w-32 truncate" title={bet.selection}>
                      {bet.selection}
                    </div>
                    <div className="text-xs text-[#9CA3AF]">{bet.market}</div>
                  </td>
                  <td className="py-3 px-2 text-[#E5E7EB]">{bet.odds}</td>
                  <td className="py-3 px-2 text-right text-[#E5E7EB]">${bet.stake.toFixed(2)}</td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getResultColor(bet.result)}`}>
                      {getResultIcon(bet.result, bet.profit)}
                      {bet.result.charAt(0).toUpperCase() + bet.result.slice(1)}
                    </span>
                  </td>
                  <td className={`py-3 px-2 text-right font-medium ${
                    bet.profit > 0 ? 'text-green-400' : bet.profit < 0 ? 'text-red-400' : 'text-[#9CA3AF]'
                  }`}>
                    {bet.profit > 0 ? '+' : ''}${bet.profit.toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(bet)}
                        className="p-1 text-[#9CA3AF] hover:text-[#F4C430] transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteBet(bet.id)}
                        className="p-1 text-[#9CA3AF] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bets.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-[#9CA3AF]">
                Showing 10 of {bets.length} bets
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}