import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, QrCode, Camera } from 'lucide-react';
import { getBatchById } from '../../services/dataService';
import { useBlockchain } from '../../context/BlockchainContext';
import { useToast } from '../../components/ToastNotification';
import QRScanner from '../../components/QRScanner';

const TracePage = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { isConnected, service } = useBlockchain();
  const [batchId, setBatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  const handleSearch = async (searchBatchId = null) => {
    const targetBatchId = searchBatchId || batchId.trim();
    
    if (!targetBatchId) {
      showError('Please enter a batch ID');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Consumer searching for batch:', targetBatchId);
      console.log('  - isConnected:', isConnected);
      
      let batchData = null;
      
      // Try blockchain first if connected
      if (isConnected && service) {
        console.log('📡 Fetching from blockchain...');
        try {
          const result = await service.getBatch(parseInt(targetBatchId));
          console.log('📥 Blockchain result:', result);
          
          if (result.success) {
            batchData = result.data;
            showSuccess('Batch found on blockchain!');
            console.log('✅ Batch loaded from blockchain:', batchData);
          }
        } catch (blockchainError) {
          console.log('⚠️ Blockchain fetch failed, trying local storage...');
        }
      }
      
      // Fallback to local storage
      if (!batchData) {
        console.log('📁 Falling back to local storage...');
        batchData = await getBatchById(targetBatchId);
        if (batchData) {
          showSuccess('Batch found in local storage');
        }
      }
      
      if (batchData) {
        navigate(`/consumer/batch?batchId=${encodeURIComponent(targetBatchId)}`);
      } else {
        showError('Batch not found. Please check the ID and try again.');
      }
    } catch (error) {
      console.error('❌ Error searching for batch:', error);
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

  const handleQRScan = (scannedBatchId) => {
    console.log('📱 QR Code scanned:', scannedBatchId);
    setBatchId(scannedBatchId);
    setQrScannerOpen(false);
    handleSearch(scannedBatchId);
  };

  return (
    <div className="page-container flex flex-col md:min-h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg space-y-8 text-center"
        >
          {/* Hero Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/25">
              <span className="text-4xl">🌿</span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold gradient-text">
              Trace Your Herb
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Enter the batch ID, scan a QR code, or upload a QR image to see the complete journey of your product.
            </p>
            {isConnected && (
              <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-full border border-green-200">
                🔗 Connected to Blockchain
              </div>
            )}
          </div>

          {/* Search Section */}
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type="text"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter Batch ID (e.g., 1, 2, 3)"
                className="input-modern pl-14 py-5 text-lg shadow-modern"
                disabled={loading}
              />
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => handleSearch()}
                disabled={loading || !batchId.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-200 shadow-xl shadow-orange-500/25 hover:shadow-2xl hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
              >
                {loading ? 'Searching...' : 'Search Batch'}
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setQrScannerOpen(true)}
                  disabled={loading}
                  className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 hover:-translate-y-0.5"
                >
                  <Camera size={20} className="mr-2" />
                  Scan QR
                </button>
                
                <button
                  onClick={() => setQrScannerOpen(true)}
                  disabled={loading}
                  className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 hover:-translate-y-0.5"
                >
                  <QrCode size={20} className="mr-2" />
                  Upload QR
                </button>
              </div>
            </div>
          </div>

          {/* Sample Batch IDs */}
          <div className="pt-8">
            <p className="text-gray-600 mb-4 font-medium">Try these sample batch IDs:</p>
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3'].map(id => (
                <button
                  key={id}
                  onClick={() => setBatchId(id)}
                  className="card-hover text-center py-4 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
                >
                  <span className="font-mono text-orange-600 font-bold text-lg">#{id}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onScan={handleQRScan}
      />
    </div>
  );
};

export default TracePage;