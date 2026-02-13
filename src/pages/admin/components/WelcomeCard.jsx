// WelcomeCard.jsx
import React from 'react';

const WelcomeCard = () => {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
      <h1 className="text-2xl font-bold mb-2">Benvenuto</h1>
      <p className="opacity-90">Sistema le tue giornate di lavoro.</p>
      <div className="mt-4 flex items-center">
        <div className="bg-white bg-opacity-20 rounded-full px-4 py-2">
          <span className="text-sm">Assegna task ai dipendenti </span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;