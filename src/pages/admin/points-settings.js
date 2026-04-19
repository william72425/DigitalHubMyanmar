import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

export default function PointsSettings() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    referralInviterPoints: 100,
    referralInviteePoints: 50,
    ownPurchaseRatio: 0.01,
    inviteePurchaseRatio: 0.005,
    minPurchaseAmount: 1000,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/points-settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: parseFloat(value) || value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/points-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-emerald-400">Points Settings</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4 text-emerald-400">Referral Rewards</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Inviter Points</label>
                <input type="number" name="referralInviterPoints" value={settings.referralInviterPoints} onChange={handleChange} className="w-full bg-slate-800 p-2 rounded border border-white/20" />
              </div>
              <div>
                <label className="block text-sm mb-1">Invitee Points</label>
                <input type="number" name="referralInviteePoints" value={settings.referralInviteePoints} onChange={handleChange} className="w-full bg-slate-800 p-2 rounded border border-white/20" />
              </div>
            </div>
          </div>
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h2 className="text-xl font-semibold mb-4 text-cyan-400">Purchase Ratios</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Own Purchase Ratio (points/MMK)</label>
                <input type="number" name="ownPurchaseRatio" value={settings.ownPurchaseRatio} onChange={handleChange} step="0.001" className="w-full bg-slate-800 p-2 rounded border border-white/20" />
              </div>
              <div>
                <label className="block text-sm mb-1">Invitee Purchase Ratio (points/MMK)</label>
                <input type="number" name="inviteePurchaseRatio" value={settings.inviteePurchaseRatio} onChange={handleChange} step="0.001" className="w-full bg-slate-800 p-2 rounded border border-white/20" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-4">
          <button onClick={() => router.back()} className="px-6 py-2 rounded border border-white/20">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-emerald-600 rounded font-bold">{saving ? 'Saving...' : 'Save Settings'}</button>
        </div>
        {message && <div className="mt-4 p-3 bg-emerald-500/20 text-emerald-400 rounded">{message}</div>}
      </div>
    </div>
  );
}
