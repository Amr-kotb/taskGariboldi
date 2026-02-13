// TrashModal.jsx
import React from 'react';

const TrashModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const deletedItems = [
    { id: 1, name: 'Old Project Plan', deletedDate: '2024-01-28', size: '2.4 MB' },
    { id: 2, name: 'Meeting Notes', deletedDate: '2024-01-27', size: '1.1 MB' },
    { id: 3, name: 'Budget Report', deletedDate: '2024-01-26', size: '3.7 MB' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Trash / Recycle Bin</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="mb-4">
          <p className="text-gray-600">Items will be permanently deleted after 30 days.</p>
        </div>
        <div className="space-y-3">
          {deletedItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-500">Deleted: {item.deletedDate}</div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">{item.size}</span>
                <div className="space-x-2">
                  <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    Restore
                  </button>
                  <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-between">
          <button className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50">
            Empty Trash
          </button>
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

export default TrashModal;