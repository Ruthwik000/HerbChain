import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getBatchesByRole } from '../../services/dataService';
import StatusBadge from '../../components/StatusBadge';
import { formatDate } from '../../utils/formatDate';

const MyBatches = () => {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const loadBatches = async () => {
      try {
        const batchesData = await getBatchesByRole('Farmer', user.id);
        setBatches(batchesData);
        setFilteredBatches(batchesData);
      } catch (error) {
        console.error('Error loading batches:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBatches();
  }, [user.id]);

  useEffect(() => {
    let filtered = batches;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(batch =>
        batch.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.herb.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'All') {
      filtered = filtered.filter(batch => batch.status === statusFilter);
    }

    setFilteredBatches(filtered);
  }, [batches, searchTerm, statusFilter]);

  const statusOptions = ['All', 'Pending', 'Approved', 'Rejected', 'Processed'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Batches</h1>
          <p className="mt-2 text-gray-600">
            Manage and track all your herb batches
          </p>
        </div>
        <Link
          to="/farmer/create-batch"
          className="mt-4 sm:mt-0 btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Create New Batch
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by Batch ID or Herb..."
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
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Batches List */}
      {filteredBatches.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {batches.length === 0 ? 'No batches yet' : 'No batches match your filters'}
          </h3>
          <p className="text-gray-500 mb-6">
            {batches.length === 0 
              ? 'Create your first herb batch to get started with traceability.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          {batches.length === 0 && (
            <Link to="/farmer/create-batch" className="btn-primary">
              <Plus size={16} className="mr-2" />
              Create Your First Batch
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBatches.map((batch, index) => (
            <motion.div
              key={batch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">
                      {batch.herb.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <Link
                      to={`/farmer/batch/${batch.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-green-600"
                    >
                      {batch.id}
                    </Link>
                    <p className="text-gray-600">{batch.herb}</p>
                    <p className="text-sm text-gray-500">
                      {batch.location} • {formatDate(batch.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Moisture</p>
                    <p className="font-medium">{batch.moisture}%</p>
                  </div>
                  <StatusBadge status={batch.status} />
                  <Link
                    to={`/farmer/batch/${batch.id}`}
                    className="btn-secondary text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>

              {batch.status === 'Rejected' && batch.rejectionReason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <span className="font-medium">Rejection Reason:</span> {batch.rejectionReason}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}


    </div>
  );
};

export default MyBatches;