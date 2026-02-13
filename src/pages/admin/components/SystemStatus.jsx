// SystemStatus.jsx
import React from 'react';

const SystemStatus = () => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">System Status</h2>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Server Uptime</span>
          <span className="text-green-600 font-medium">99.9%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Database</span>
          <span className="text-green-600 font-medium">Online</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">API Status</span>
          <span className="text-green-600 font-medium">Operational</span>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;