import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Droplets, 
  User,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { getBatchById, approveBatch, rejectBatch } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastNotification';
import StatusBadge from '../../components/StatusBadge';
import JourneyTimeline from '../../components/JourneyTimeline';
import MapView from '../../components/MapView';
import ApproveRejectModal from '../../components/ApproveRejectModal';
import { formatDate, formatDateTime } from '../../utils/formatDate';

const BatchDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: null
  });

  useEffect(() => {
    const loadBatch = async () => {
      try {
        const batchData = await getBatchById(batchId);
        if (!batchData) {
          showError('Batch not found');
          navigate('/lab/dashboard');
          return;
        }
        
        setBatch(batchData);
      } catch (error) {
        showError('Failed to load batch details');
        navigate('/lab/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (batchId) {
      loadBatch();
    }
  }, [batchId, navigate, showError]);

  const handleApprove = () => {
    setModalState({ isOpen: true, action: 'approve' });
  };

  const handleReject = () => {
    setModalState({ isOpen: true, action: 'reject' });
  };

  const handleModalConfirm = async (batchId, reason) => {
    setActionLoading(true);
    
    try {
      let updatedBatch;
      
      if (modalState.action === 'approve') {
        updatedBatch = await approveBatch(batchId, user.name);
        showSuccess(`Batch ${batchId} approved successfully`);
      } else {
        updatedBatch = await rejectBatch(batchId, reason, user.name);
        showSuccess(`Batch ${batchId} rejected`);
      }
      
      setBatch(updatedBatch);
      setModalState({ isOpen: false, action: null });
    } catch (error) {
      showError(`Failed to ${modalState.action} batch`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalState({ isOpen: false, action: null });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Batch not found</h3>
        <p className="text-gray-500 mb-6">The requested batch could not be found.</p>
        <button
          onClick={() => navigate('/lab/dashboard')}
          className="btn-primary"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/lab/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </button>
        
        {batch.status === 'Pending' && (
          <div className="flex space-x-3">
            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle size={16} className="mr-2" />
              Reject
            </button>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle size={16} className="mr-2" />
              Approve
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Batch Review</h1>
        <p className="text-gray-600">Quality assessment and approval</p>
      </div>

      {/* Quality Alert */}
      {batch.moisture > 10 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border border-orange-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
            <div>
              <h4 className="font-medium text-orange-800">High Moisture Content</h4>
              <p className="text-sm text-orange-700">
                This batch has {batch.moisture}% moisture content, which is above the recommended 10% threshold.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Batch Information</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Batch ID</span>
              <span className="font-mono font-medium text-gray-900">{batch.id}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Herb Name</span>
              <span className="font-medium text-gray-900">{batch.herb}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Status</span>
              <StatusBadge status={batch.status} />
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 flex items-center">
                <User size={16} className="mr-1" />
                Farmer
              </span>
              <span className="font-medium text-gray-900">{batch.farmer}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 flex items-center">
                <Droplets size={16} className="mr-1" />
                Moisture %
              </span>
              <span className={`font-medium ${batch.moisture > 10 ? 'text-orange-600' : 'text-gray-900'}`}>
                {batch.moisture}%
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 flex items-center">
                <Calendar size={16} className="mr-1" />
                Harvest Date
              </span>
              <span className="font-medium text-gray-900">{formatDate(batch.harvestDate)}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 flex items-center">
                <MapPin size={16} className="mr-1" />
                Location
              </span>
              <span className="font-medium text-gray-900">{batch.location}</span>
            </div>
            
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-600">Submitted</span>
              <span className="font-medium text-gray-900">{formatDateTime(batch.createdAt)}</span>
            </div>
          </div>

          {/* Notes */}
          {batch.notes && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <FileText size={16} className="mr-2" />
                Farmer Notes
              </h4>
              <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">{batch.notes}</p>
            </div>
          )}

          {/* Quality Assessment Guidelines */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Quality Guidelines</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Moisture content should be ≤ 10%</li>
              <li>• Harvest date within 30 days</li>
              <li>• Clear location information</li>
              <li>• Visual inspection of batch photo</li>
            </ul>
          </div>
        </motion.div>

        {/* Photo and Map */}
        <div className="space-y-6">
          {/* Photo */}
          {batch.photoUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ImageIcon size={20} className="mr-2" />
                Batch Photo
              </h3>
              
              {!imageError ? (
                <img
                  src={batch.photoUrl}
                  alt={`${batch.herb} batch ${batch.id}`}
                  className="w-full h-64 object-cover rounded-lg border border-gray-200"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-64 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Image could not be loaded</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin size={20} className="mr-2" />
              Farm Location
            </h3>
            
            <MapView 
              location={batch.location} 
              coordinates={batch.coordinates}
            />
          </motion.div>
        </div>
      </div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Processing Timeline</h2>
        
        <JourneyTimeline 
          timeline={batch.timeline || []}
          currentStatus={batch.status}
        />
      </motion.div>

      {/* Approve/Reject Modal */}
      <ApproveRejectModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        batch={batch}
        action={modalState.action}
        loading={actionLoading}
      />
    </div>
  );
};

export default BatchDetails;