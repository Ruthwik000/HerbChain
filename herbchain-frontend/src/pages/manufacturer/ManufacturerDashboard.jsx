import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Factory, CheckCircle, Package, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBlockchain } from '../../context/BlockchainContext';
import { getBatchesByRole, markAsProcessed } from '../../services/dataService';
import { useToast } from '../../components/ToastNotification';
import BatchProcessingCard from '../../components/BatchProcessingCard';
import QRCodeModal from '../../components/QRCodeModal';

const ManufacturerDashboard = () => {
  const { user } = useAuth();
  const { isConnected, service, account } = useBlockchain();
  const { showSuccess, showError } = useToast();
  
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [herbFilter, setHerbFilter] = useState('All');
  
  // QR Modal state
  const [qrModal, setQrModal] = useState({
    isOpen: false,
    batch: null
  });

  useEffect(() => {
    loadBatches();
  }, [isConnected, service, account]);

  useEffect(() => {
    filterBatches();
  }, [batches, searchTerm, statusFilter, herbFilter]);

  const loadBatches = async () => {
    try {
      console.log('🏭 Loading manufacturer batches...');
      console.log('  - isConnected:', isConnected);
      console.log('  - account:', account);
      
      let batchesData = [];
      
      if (isConnected && service) {
        console.log('📡 Fetching batches from blockchain...');
        
        // Get approved batches that are ready for processing
        const approvedResult = await service.getApprovedBatches();
        console.log('📥 Approved batches result:', approvedResult);
        
        if (approvedResult.success) {
          batchesData = approvedResult.batches;
          console.log('✅ Approved batches loaded from blockchain:', batchesData);
        }
        
        // Also get any processed batches to show complete picture
        try {
          // Get total batches and check for processed ones
          const totalBatchesResult = await service.getTotalBatches();
          if (totalBatchesResult.success && totalBatchesResult.total > 0) {
            const allBatchIds = new Set(batchesData.map(b => b.id));
            
            for (let i = 0; i < totalBatchesResult.total; i++) {
              if (!allBatchIds.has(i)) {
                try {
                  const batchResult = await service.getBatch(i);
                  if (batchResult.success && batchResult.data.status === 'Processed') {
                    batchesData.push(batchResult.data);
                  }
                } catch (error) {
                  console.log(`⚠️ Could not fetch batch ${i}:`, error.message);
                }
              }
            }
          }
        } catch (error) {
          console.log('⚠️ Could not fetch processed batches:', error.message);
        }
        
        if (batchesData.length === 0) {
          console.log('📁 No blockchain batches found, falling back to local storage');
          batchesData = await getBatchesByRole('Manufacturer', user.id);
        }
      } else {
        console.log('📁 Loading from local storage (not connected to blockchain)');
        batchesData = await getBatchesByRole('Manufacturer', user.id);
      }
      
      setBatches(batchesData);
    } catch (error) {
      console.error('❌ Error loading manufacturer batches:', error);
      // Fallback to local storage on error
      try {
        const batchesData = await getBatchesByRole('Manufacturer', user.id);
        setBatches(batchesData);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        showError('Failed to load batches');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterBatches = () => {
    let filtered = batches;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(batch => {
        const batchId = batch.id?.toString() || '';
        const herbName = batch.herbName || batch.herb || '';
        const farmerAddress = batch.farmer || '';
        
        return batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
               herbName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               farmerAddress.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(batch => {
        const status = batch.status || 'Pending';
        return status === statusFilter;
      });
    }

    // Filter by herb
    if (herbFilter !== 'All') {
      filtered = filtered.filter(batch => {
        const herbName = batch.herbName || batch.herb;
        return herbName === herbFilter;
      });
    }

    setFilteredBatches(filtered);
  };

  const handleMarkProcessed = async (batchId) => {
    setActionLoading(true);
    
    try {
      console.log(`🏭 Processing batch ${batchId}...`);
      
      let result;
      
      if (isConnected && service) {
        // Generate QR code hash for the batch
        const qrCodeHash = `QR-${batchId}-${Date.now()}`;
        
        // Use blockchain service
        result = await service.processBatch(parseInt(batchId), qrCodeHash);
        console.log('📥 Process result:', result);
        
        if (result.success) {
          showSuccess(`Batch ${batchId} processed successfully on blockchain`);
          
          // Reload batches to get updated data
          console.log('🔄 Reloading batches after processing...');
          await loadBatches();
          
          // Get the updated batch for QR modal
          const updatedBatchResult = await service.getBatch(parseInt(batchId));
          if (updatedBatchResult.success) {
            // Show QR code modal
            setQrModal({
              isOpen: true,
              batch: updatedBatchResult.data
            });
          }
        } else {
          throw new Error(result.error);
        }
      } else {
        // Fallback to local storage
        const processingNotes = `Processed by ${user.name} on ${new Date().toLocaleDateString()}`;
        const updatedBatch = await markAsProcessed(batchId, processingNotes, user.name);
        
        // Update local state
        setBatches(prev => prev.map(batch => 
          batch.id === batchId ? updatedBatch : batch
        ));
        
        showSuccess(`Batch ${batchId} marked as processed`);
        
        // Show QR code modal
        setQrModal({
          isOpen: true,
          batch: updatedBatch
        });
      }
      
    } catch (error) {
      console.error(`❌ Failed to process batch:`, error);
      showError(`Failed to process batch: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseQRModal = () => {
    setQrModal({ isOpen: false, batch: null });
  };

  // Get unique herbs for filter
  const uniqueHerbs = [...new Set(batches.map(batch => batch.herbName || batch.herb).filter(Boolean))];
  
  // Calculate stats
  const stats = {
    total: batches.length,
    approved: batches.filter(b => (b.status || 'Pending') === 'Approved').length,
    processed: batches.filter(b => (b.status || 'Pending') === 'Processed').length,
    pending: batches.filter(b => (b.status || 'Pending') === 'Pending').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            Welcome, Manufacturer <span className="ml-2">🏭</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Process approved herb batches and generate QR codes for traceability
            {isConnected && <span className="text-green-600"> • Connected to Blockchain</span>}
          </p>
        </div>
        <button
          onClick={loadBatches}
          disabled={loading}
          className="btn-secondary flex items-center"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Batches', value: stats.total, icon: Factory, color: 'text-blue-600', bgColor: 'bg-blue-50' },
          { title: 'Ready to Process', value: stats.approved, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
          { title: 'Processed', value: stats.processed, icon: Package, color: 'text-orange-600', bgColor: 'bg-orange-50' },
          { title: 'In Lab Review', value: stats.pending, icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by Batch ID, Herb, or Farmer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="All">All Status</option>
              <option value="Approved">Ready to Process</option>
              <option value="Processed">Processed</option>
              <option value="Pending">In Lab Review</option>
            </select>
          </div>

          {/* Herb Filter */}
          <select
            value={herbFilter}
            onChange={(e) => setHerbFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <option value="All">All Herbs</option>
            {uniqueHerbs.map(herb => (
              <option key={herb} value={herb}>{herb}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Batches List */}
      {filteredBatches.length === 0 ? (
        <div className="card text-center py-12">
          <Factory className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {batches.length === 0 ? 'No batches available' : 'No batches match your filters'}
          </h3>
          <p className="text-gray-500">
            {batches.length === 0 
              ? 'Approved batches from the lab will appear here for processing.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBatches.map((batch, index) => (
            <BatchProcessingCard
              key={batch.id}
              batch={batch}
              onMarkProcessed={handleMarkProcessed}
              loading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={handleCloseQRModal}
        batch={qrModal.batch}
      />
    </div>
  );
};

export default ManufacturerDashboard;