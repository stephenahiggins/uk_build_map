import React, { useEffect, useState } from 'react';
import { getPendingEvidence, approveEvidence, rejectEvidence } from '../../../services/evidenceService';
import Button from '../../molecules/Button';

interface EvidenceItem {
  id: string;
  title: string;
  summary?: string;
  projectId: string;
}

const ModerationPage: React.FC = () => {
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getPendingEvidence();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleApprove = async (id: string) => {
    await approveEvidence(id);
    fetchItems();
  };

  const handleReject = async (id: string) => {
    await rejectEvidence(id);
    fetchItems();
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Moderate Evidence</h1>
      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div>No pending evidence</div>
      ) : (
        <ul className="space-y-4">
          {items.map((ev) => (
            <li key={ev.id} className="bg-white shadow p-4 rounded">
              <h2 className="font-semibold">{ev.title}</h2>
              {ev.summary && <p className="text-sm mb-2">{ev.summary}</p>}
              <div className="flex gap-2">
                <Button size="small" onClick={() => handleApprove(ev.id)} text="Approve" />
                <Button size="small" variant="secondary" onClick={() => handleReject(ev.id)} text="Reject" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ModerationPage;
