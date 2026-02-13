// HistoryModal.jsx
import React from 'react';

const HistoryModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const historyItems = [
    { id: 1, user: 'Admin', role: 'admin' },
    { id: 2, user: 'andrea', role: 'dipendente' },
    { id: 3, user: 'stefano', role: 'dipendente' },
    { id: 4, user: 'domenico', role: 'dipendente' },
    { id: 5, user: 'leonardo', role: 'dipendente' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Task History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          {historyItems.map((item) => (
            <div key={item.id} className="border-b pb-3 last:border-b-0">
              <div className="flex justify-between">
                <span className="font-medium">{item.action}</span>
                <span className="text-sm text-gray-500">{item.date}</span>
              </div>
              <div className="text-sm text-gray-600">By: {item.user}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;