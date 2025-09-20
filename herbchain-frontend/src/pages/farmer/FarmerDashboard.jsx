import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBlockchain } from '../../context/BlockchainContext';
import { getBatchStats, getBatchesByRole } from '../../services/dataService';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/formatDate';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const { isConnected, service, account } = useBlockchain();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    processed: 0
  });
  const [recentBatches, setRecentBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        console.log('📊 Loading dashboard data...');
        console.log('  - isConnected:', isConnected);
        console.log('  - account:', account);
        
        let batchesData = [];
        
        if (isConnected && service && account) {
          console.log('📡 Fetching batches from blockchain...');
          // Get batches from blockchain
          const result = await service.getFarmerBatches(account);
          console.log('📥 Blockchain result:', result);
          
          if (result.success) {
            batchesData = result.batches;
            console.log('✅ Batches loaded from blockchain:', batchesData);
          } else {
            console.log('❌ Failed to load from blockchain, falling back to local storage');
            batchesData = await getBatchesByRole('Farmer', user.id);
          }
        } else {
          console.log('📁 Loading from local storage (not connected to blockchain)');
          batchesData = await getBatchesByRole('Farmer', user.id);
        }
        
        // Calculate stats from batches
        const calculatedStats = {
          total: batchesData.length,
          pending: batchesData.filter(b => (b.status || 'Pending') === 'Pending').length,
          approved: batchesData.filter(b => (b.status || 'Pending') === 'Approved').length,
          rejected: batchesData.filter(b => (b.status || 'Pending') === 'Rejected').length,
          processed: batchesData.filter(b => (b.status || 'Pending') === 'Processed').length
        };
        
        console.log('📈 Calculated stats:', calculatedStats);
        
        setStats(calculatedStats);
        setRecentBatches(batchesData.slice(0, 5)); // Show only 5 recent batches
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        // Fallback to local storage on error
        try {
          const [statsData, batchesData] = await Promise.all([
            getBatchStats(user.id),
            getBatchesByRole('Farmer', user.id)
          ]);
          setStats(statsData);
          setRecentBatches(batchesData.slice(0, 5));
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user.id, isConnected, service, account]);

  const statCards = [
    {
      title: 'Total Batches',
      value: stats.total,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="content-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="section-header flex items-center">
            Hello, {user.name} <span className="ml-3 text-4xl">🌱</span>
          </h1>
          <p className="section-subtitle">
            Track your herb batches and monitor their progress through the supply chain
            {isConnected && <span className="inline-flex items-center ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">🔗 Blockchain Connected</span>}
          </p>
        </div>
        <Link
          to="/farmer/create-batch"
          className="btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Create New Batch
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card-hover"
            >
              <div className="flex items-center">
                <div className={`p-4 rounded-xl ${stat.bgColor} shadow-sm`}>
                  <Icon className={`h-7 w-7 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Batches */}
      <div className="card-gradient">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Batches</h2>
          <Link
            to="/farmer/my-batches"
            className="text-green-600 hover:text-green-700 font-semibold transition-colors"
          >
            View All →
          </Link>
        </div>

        {recentBatches.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No batches yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first herb batch.
            </p>
            <div className="mt-6">
              <Link to="/farmer/create-batch" className="btn-primary">
                <Plus size={16} className="mr-2" />
                Create Your First Batch
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {recentBatches.map((batch) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-semibold">
                      {(batch.herbName || batch.herb || 'H').charAt(0)}
                    </span>
                  </div>
                  <div>
                    <Link
                      to={`/farmer/batch/${batch.id}`}
                      className="font-medium text-gray-900 hover:text-green-600"
                    >
                      Batch #{batch.id}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {batch.herbName || batch.herb} • {formatDate(batch.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <StatusBadge status={batch.status || 'Pending'} />
                  <Link
                    to={`/farmer/batch/${batch.id}`}
                    className="text-sm text-green-600 hover:text-green-700"
                  >
                    View Details
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDashboard;