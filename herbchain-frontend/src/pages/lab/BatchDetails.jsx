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
import { useBlockchain } from '../../context/BlockchainContext';
import { useToast } from '../../components/ToastNotification';
import StatusBadge from '../../components/StatusBadge';
import JourneyTimeline from '../../components/JourneyTimeline';
import MapView from '../../components/MapView';
import ApproveRejectModal from '../../components/ApproveRejectModal';
import { formatDate, formatDateTime } from '../../utils/formatDate';
import { getImage, getAllImageHashes, getImageFromIPFS } from '../../services/imageService';
import { debugImageStorage, checkImageHash } from '../../utils/imageDebug';
import { relinkImages } from '../../utils/imageRelink';

const BatchDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, service, account } = useBlockchain();
  const { showSuccess, showError } = useToast();
  
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [timeline, setTimeline] = useState([]);
  
  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: null
  });

  useEffect(() => {
    const loadBatch = async () => {
      try {
        console.log('🧪 Loading lab batch details for ID:', batchId);
        console.log('  - isConnected:', isConnected);
        console.log('  - account:', account);
        
        let batchData = null;
        
        if (isConnected && service) {
          console.log('📡 Fetching batch from blockchain...');
          // Try to get batch from blockchain first
          const result = await service.getBatch(parseInt(batchId));
          console.log('📥 Blockchain result:', result);
          
          if (result.success) {
            batchData = result.data;
            console.log('✅ Batch loaded from blockchain:', batchData);
          }
        }
        
        // Fallback to local storage if blockchain fails
        if (!batchData) {
          console.log('📁 Falling back to local storage...');
          batchData = await getBatchById(batchId);
        }
        
        if (!batchData) {
          showError('Batch not found');
          navigate('/lab/dashboard');
          return;
        }
        
        setBatch(batchData);
        
        // Try to relink images if there's a mismatch
        if (batchData.photoIpfsHash && !getImage(batchData.photoIpfsHash)) {
          console.log('🔗 Attempting to relink image for batch...');
          relinkImages(batchData);
        }
        
        // Fetch timeline from blockchain if connected
        if (isConnected && service) {
          console.log('📅 Fetching timeline from blockchain...');
          const timelineResult = await service.getBatchTimeline(parseInt(batchId));
          if (timelineResult.success) {
            setTimeline(timelineResult.timeline);
            console.log('✅ Timeline loaded from blockchain:', timelineResult.timeline);
          } else {
            console.log('❌ Failed to load timeline from blockchain');
            setTimeline(batchData.timeline || []);
          }
        } else {
          setTimeline(batchData.timeline || []);
        }
      } catch (error) {
        console.error('❌ Error loading lab batch details:', error);
        showError('Failed to load batch details');
        navigate('/lab/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (batchId) {
      loadBatch();
    }
  }, [batchId, navigate, showError, isConnected, service, account]);

  const handleApprove = () => {
    setModalState({ isOpen: true, action: 'approve' });
  };

  const handleReject = () => {
    setModalState({ isOpen: true, action: 'reject' });
  };

  const handleModalConfirm = async (batchId, reason) => {
    setActionLoading(true);
    
    try {
      console.log(`🧪 ${modalState.action}ing batch ${batchId}...`);
      
      let result;
      
      if (isConnected && service) {
        // Use blockchain service
        if (modalState.action === 'approve') {
          result = await service.approveBatch(parseInt(batchId));
          console.log('📥 Approve result:', result);
        } else {
          result = await service.rejectBatch(parseInt(batchId), reason);
          console.log('📥 Reject result:', result);
        }
        
        if (result.success) {
          showSuccess(`Batch ${batchId} ${modalState.action}d successfully on blockchain`);
          
          // Reload batch data to get updated status
          const updatedResult = await service.getBatch(parseInt(batchId));
          if (updatedResult.success) {
            setBatch(updatedResult.data);
          }
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
        
        setBatch(updatedBatch);
        showSuccess(`Batch ${batchId} ${modalState.action}d successfully`);
      }
      
      setModalState({ isOpen: false, action: null });
    } catch (error) {
      console.error(`❌ Failed to ${modalState.action} batch:`, error);
      showError(`Failed to ${modalState.action} batch: ${error.message}`);
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
        <p className="text-gray-600">
          Quality assessment and approval
          {isConnected && <span className="text-green-600"> • Blockchain Data</span>}
        </p>
      </div>

      {/* Quality Alert */}
      {(batch.moisturePercent || batch.moisture) > 10 && (
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
                This batch has {batch.moisturePercent || batch.moisture}% moisture content, which is above the recommended 10% threshold.
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
              <span className="font-medium text-gray-900">{batch.herbName || batch.herb}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Status</span>
              <StatusBadge status={batch.status || 'Pending'} />
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 flex items-center">
                <User size={16} className="mr-1" />
                Farmer
              </span>
              <span className="font-medium text-gray-900 font-mono text-sm">
                {batch.farmer ? `${batch.farmer.substring(0, 6)}...${batch.farmer.substring(batch.farmer.length - 4)}` : 'N/A'}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 flex items-center">
                <Droplets size={16} className="mr-1" />
                Moisture %
              </span>
              <span className={`font-medium ${(batch.moisturePercent || batch.moisture) > 10 ? 'text-orange-600' : 'text-gray-900'}`}>
                {batch.moisturePercent || batch.moisture}%
              </span>
            </div>
            
            {batch.harvestDate && (
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600 flex items-center">
                  <Calendar size={16} className="mr-1" />
                  Harvest Date
                </span>
                <span className="font-medium text-gray-900">{formatDate(batch.harvestDate)}</span>
              </div>
            )}
            
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
            
            {(() => {
              // Try to get image from local storage first
              const storedImage = batch.photoIpfsHash ? getImage(batch.photoIpfsHash) : null;
              
              if (batch.photoUrl && !imageError) {
                return (
                  <img
                    src={batch.photoUrl}
                    alt={`${batch.herbName || batch.herb} batch ${batch.id}`}
                    className="w-full h-64 object-cover rounded-lg border border-gray-200"
                    onError={() => setImageError(true)}
                  />
                );
              } else if (storedImage && !imageError) {
                return (
                  <img
                    src={storedImage}
                    alt={`${batch.herbName || batch.herb} batch ${batch.id}`}
                    className="w-full h-64 object-cover rounded-lg border border-gray-200"
                    onError={() => setImageError(true)}
                  />
                );
              } else if (batch.photoIpfsHash) {
                return (
                  <div className="w-full h-64 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-2">Photo stored on IPFS</p>
                      <p className="text-xs text-gray-400 font-mono">{batch.photoIpfsHash}</p>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="w-full h-64 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No photo available</p>
                    </div>
                  </div>
                );
              }
            })()}
          </motion.div>

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
          timeline={timeline}
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