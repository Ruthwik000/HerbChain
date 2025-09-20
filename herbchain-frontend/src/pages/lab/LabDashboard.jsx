import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Beaker, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBlockchain } from '../../context/BlockchainContext';
import { getBatchesByRole, approveBatch, rejectBatch } from '../../services/dataService';
import { useToast } from '../../components/ToastNotification';
import BatchReviewCard from '../../components/BatchReviewCard';
import ApproveRejectModal from '../../components/ApproveRejectModal';

const LabDashboard = () => {
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
  
  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    batch: null,
    action: null
  });

  useEffect(() => {
    loadBatches();
  }, [isConnected, service, account]);

  useEffect(() => {
    filterBatches();
  }, [batches, searchTerm, statusFilter, herbFilter]);

  const loadBatches = async () => {
    try {
      console.log('🧪 Loading lab batches...');
      console.log('  - isConnected:', isConnected);
      console.log('  - account:', account);
      
      let batchesData = [];
      
      if (isConnected && service) {
        console.log('📡 Fetching batches from blockchain...');
        
        // Get all batches that lab officers need to see
        console.log('📡 Fetching all batches for lab view...');
        
        const allBatchIds = new Set(); // Use Set to avoid duplicates
        
        // Get pending batches
        try {
          const pendingResult = await service.getPendingBatches();
          console.log('📥 Pending batches result:', pendingResult);
          if (pendingResult.success) {
            pendingResult.batches.forEach(batch => {
              allBatchIds.add(batch.id);
              batchesData.push(batch);
            });
          }
        } catch (error) {
          console.log('⚠️ Could not fetch pending batches:', error.message);
        }
        
        // Get approved batches
        try {
          const approvedResult = await service.getApprovedBatches();
          console.log('📥 Approved batches result:', approvedResult);
          if (approvedResult.success) {
            approvedResult.batches.forEach(batch => {
              if (!allBatchIds.has(batch.id)) {
                allBatchIds.add(batch.id);
                batchesData.push(batch);
              }
            });
          }
        } catch (error) {
          console.log('⚠️ Could not fetch approved batches:', error.message);
        }
        
        // Get total batches and try to fetch any missing ones (including rejected)
        try {
          const totalBatchesResult = await service.getTotalBatches();
          console.log('📊 Total batches result:', totalBatchesResult);
          
          if (totalBatchesResult.success && totalBatchesResult.total > 0) {
            // Check if we have all batches, if not fetch missing ones
            for (let i = 0; i < totalBatchesResult.total; i++) {
              if (!allBatchIds.has(i)) {
                try {
                  const batchResult = await service.getBatch(i);
                  if (batchResult.success) {
                    batchesData.push(batchResult.data);
                    allBatchIds.add(i);
                  }
                } catch (error) {
                  console.log(`⚠️ Could not fetch batch ${i}:`, error.message);
                }
              }
            }
          }
        } catch (error) {
          console.log('⚠️ Could not get total batches:', error.message);
        }
        
        console.log('✅ All batches loaded from blockchain:', batchesData);
        
        if (batchesData.length === 0) {
          console.log('📁 No blockchain batches found, falling back to local storage');
          batchesData = await getBatchesByRole('Lab', user.id);
        }
      } else {
        console.log('📁 Loading from local storage (not connected to blockchain)');
        batchesData = await getBatchesByRole('Lab', user.id);
      }
      
      setBatches(batchesData);
    } catch (error) {
      console.error('❌ Error loading lab batches:', error);
      // Fallback to local storage on error
      try {
        const batchesData = await getBatchesByRole('Lab', user.id);
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
      if (statusFilter === 'Approved') {
        // Show both approved and processed batches when "Approved" is selected
        filtered = filtered.filter(batch => {
          const status = batch.status || 'Pending';
          return status === 'Approved' || status === 'Processed';
        });
      } else {
        filtered = filtered.filter(batch => {
          const status = batch.status || 'Pending';
          return status === statusFilter;
        });
      }
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

  const handleApprove = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    setModalState({
      isOpen: true,
      batch,
      action: 'approve'
    });
  };

  const handleReject = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    setModalState({
      isOpen: true,
      batch,
      action: 'reject'
    });
  };

  const handleModalConfirm = async (batchId, reason) => {
    setActionLoading(true);
    
    try {
      console.log(`🧪 ${modalState.action}ing batch ${batchId}...`);
      
      let result;
      
      if (isConnected && service) {
        // Use blockchain service
        if (modalState.action === 'approve') {
          result = await service.approveBatch(batchId);
          console.log('📥 Approve result:', result);
        } else {
          result = await service.rejectBatch(batchId, reason);
          console.log('📥 Reject result:', result);
        }
        
        if (result.success) {
          showSuccess(`Batch ${batchId} ${modalState.action}d successfully on blockchain`);
          // Reload batches to get updated data
          console.log('🔄 Reloading batches after action...');
          await loadBatches();
        } else {
          throw new Error(result.error);
        }
      } else {
        // Fallback to local storage
        let updatedBatch;
        if (modalState.action === 'approve') {
          updatedBatch = await approveBatch(batchId, user.name);
        } else {
          updatedBatch = await rejectBatch(batchId, reason, user.name);
        }
        
        // Update local state
        setBatches(prev => prev.map(batch => 
          batch.id === batchId ? updatedBatch : batch
        ));
        
        showSuccess(`Batch ${batchId} ${modalState.action}d successfully`);
      }
      
      setModalState({ isOpen: false, batch: null, action: null });
    } catch (error) {
      console.error(`❌ Failed to ${modalState.action} batch:`, error);
      showError(`Failed to ${modalState.action} batch: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalState({ isOpen: false, batch: null, action: null });
  };

  // Get unique herbs for filter
  const uniqueHerbs = [...new Set(batches.map(batch => batch.herbName || batch.herb).filter(Boolean))];
  
  // Calculate stats
  const stats = {
    total: batches.length,
    pending: batches.filter(b => (b.status || 'Pending') === 'Pending').length,
    approved: batches.filter(b => {
      const status = b.status || 'Pending';
      return status === 'Approved' || status === 'Processed';
    }).length,
    rejected: batches.filter(b => (b.status || 'Pending') === 'Rejected').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            Welcome, Lab Officer <span className="ml-2">🧪</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Review and approve herb batches for quality assurance
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
          { title: 'Total Batches', value: stats.total, icon: Beaker, color: 'text-blue-600', bgColor: 'bg-blue-50' },
          { title: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
          { title: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
          { title: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' }
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved (Inc. Processed)</option>
              <option value="Processed">Processed Only</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Herb Filter */}
          <select
            value={herbFilter}
            onChange={(e) => setHerbFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50"
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
          <Beaker className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {batches.length === 0 ? 'No batches to review' : 'No batches match your filters'}
          </h3>
          <p className="text-gray-500">
            {batches.length === 0 
              ? 'Batches submitted by farmers will appear here for review.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBatches.map((batch, index) => (
            <BatchReviewCard
              key={batch.id}
              batch={batch}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Approve/Reject Modal */}
      <ApproveRejectModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        batch={modalState.batch}
        action={modalState.action}
        loading={actionLoading}
      />
    </div>
  );
};

export default LabDashboard;