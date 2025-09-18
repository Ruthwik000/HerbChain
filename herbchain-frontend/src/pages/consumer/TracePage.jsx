import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { getBatchById } from '../../services/dataService';
import { useToast } from '../../components/ToastNotification';

const TracePage = () => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [batchId, setBatchId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!batchId.trim()) {
      showError('Please enter a batch ID');
      return;
    }

    setLoading(true);
    try {
      const batch = await getBatchById(batchId.trim());
      if (batch) {
        navigate(`/consumer/batch?batchId=${encodeURIComponent(batchId.trim())}`);
      } else {
        showError('Batch not found. Please check the ID and try again.');
      }
    } catch (error) {
      showError('Error searching for batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:min-h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-8 text-center"
        >
          {/* Hero Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl">🌿</span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Trace Your Herb
            </h1>
            <p className="text-gray-600 leading-relaxed">
              Enter the batch ID to see the journey of your product.
            </p>
          </div>

          {/* Search Section */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter Batch ID"
                className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg shadow-sm"
                disabled={loading}
              />
            </div>
            
            <button
              onClick={handleSearch}
              disabled={loading || !batchId.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Sample Batch IDs */}
          <div className="pt-8">
            <p className="text-sm text-gray-500 mb-4">Try these sample batch IDs:</p>
            <div className="space-y-2">
              {['ASH-2025-001', 'TUL-2025-002', 'TUR-2025-003'].map(id => (
                <button
                  key={id}
                  onClick={() => setBatchId(id)}
                  className="block w-full text-center px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-colors shadow-sm"
                >
                  <span className="font-mono text-orange-600 font-medium">{id}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>


    </div>
  );
};

export default TracePage;