import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { History, Search, Trash2, Eye, Calendar } from 'lucide-react';
import { getConsumerHistory, saveConsumerHistory } from '../../services/localStorageService';
import { getBatchById } from '../../services/dataService';
import { useToast } from '../../components/ToastNotification';
import StatusBadge from '../../components/StatusBadge';
// Simple date formatting utilities
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};

const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

const HistoryPage = () => {
  const { showSuccess } = useToast();
  const [history, setHistory] = useState([]);
  const [batchDetails, setBatchDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const historyData = getConsumerHistory();
      setHistory(historyData);
      
      // Load batch details for each history item
      const details = {};
      for (const item of historyData) {
        try {
          const batch = await getBatchById(item.batchId);
          if (batch) {
            details[item.batchId] = batch;
          }
        } catch (error) {
          // Batch might not exist anymore
          console.warn(`Batch ${item.batchId} not found`);
        }
      }
      setBatchDetails(details);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    saveConsumerHistory([]);
    setHistory([]);
    setBatchDetails({});
    showSuccess('History cleared');
  };

  const removeItem = (batchId) => {
    const updatedHistory = history.filter(item => item.batchId !== batchId);
    saveConsumerHistory(updatedHistory);
    setHistory(updatedHistory);
    
    const updatedDetails = { ...batchDetails };
    delete updatedDetails[batchId];
    setBatchDetails(updatedDetails);
    
    showSuccess('Item removed from history');
  };

  const filteredHistory = history.filter(item => {
    if (!searchTerm) return true;
    const batch = batchDetails[item.batchId];
    return (
      item.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (batch && batch.herb.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const groupHistoryByDate = (history) => {
    const groups = {};
    
    history.forEach(item => {
      const date = new Date(item.lastViewed);
      let groupKey;
      
      if (isToday(date)) {
        groupKey = 'Today';
      } else if (isYesterday(date)) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const groupedHistory = groupHistoryByDate(filteredHistory);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            Scan History <span className="ml-2">⏳</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Your recently viewed herb batches
          </p>
        </div>
        
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="mt-4 sm:mt-0 flex items-center px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-lg transition-colors"
          >
            <Trash2 size={16} className="mr-2" />
            Clear History
          </button>
        )}
      </div>

      {/* Search */}
      {history.length > 0 && (
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by Batch ID or Herb name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>
        </div>
      )}

      {/* History Content */}
      {history.length === 0 ? (
        <div className="card text-center py-12">
          <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No scan history</h3>
          <p className="text-gray-500 mb-6">
            Batches you verify will appear here for easy access.
          </p>
          <Link to="/consumer/trace" className="btn-primary">
            Scan Your First Batch
          </Link>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="card text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matches found</h3>
          <p className="text-gray-500">
            Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedHistory).map(([dateGroup, items]) => (
            <div key={dateGroup} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar size={18} className="mr-2" />
                {dateGroup}
              </h2>
              
              <div className="space-y-3">
                {items.map((item, index) => {
                  const batch = batchDetails[item.batchId];
                  
                  return (
                    <motion.div
                      key={item.batchId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="card hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-green-600 font-bold">
                              {batch ? batch.herb.charAt(0) : '?'}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-1">
                              <Link
                                to={`/consumer/batch?batchId=${item.batchId}`}
                                className="font-medium text-gray-900 hover:text-green-600 transition-colors"
                              >
                                {item.batchId}
                              </Link>
                              {batch && <StatusBadge status={batch.status} />}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              {batch ? (
                                <>
                                  <span className="font-medium">{batch.herb}</span>
                                  <span>•</span>
                                  <span>{batch.farmer}</span>
                                </>
                              ) : (
                                <span className="text-gray-400">Batch details unavailable</span>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-1">
                              Viewed {formatRelativeTime(item.lastViewed)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/consumer/batch?batchId=${item.batchId}`}
                            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Eye size={16} className="mr-2" />
                            View
                          </Link>
                          
                          <button
                            onClick={() => removeItem(item.batchId)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Remove from history"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {history.length > 0 && (
        <div className="card bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              You have verified <span className="font-medium text-gray-900">{history.length}</span> batch{history.length !== 1 ? 'es' : ''} total
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;