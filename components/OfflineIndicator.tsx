import React from 'react';

const OfflineIndicator: React.FC = () => {
    return (
        <div className="bg-yellow-800/60 border border-yellow-700 text-yellow-200 px-4 py-2 rounded-lg text-center mb-4 text-sm" role="status">
            You are currently offline. Translation is disabled. Speech features will use your device's capabilities and may be limited.
        </div>
    );
};

export default OfflineIndicator;
