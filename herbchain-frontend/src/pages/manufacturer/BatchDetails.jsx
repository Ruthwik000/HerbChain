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
  Package,
  QrCode,
  AlertCircle
} from 'lucide-react';
import { getBatchById, markAsProcessed } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { useBlockchain } from '../../context/BlockchainContext';
import { useToast } from '../../components/ToastNotification';
import StatusBadge from '../../components/StatusBadge';
import JourneyTimeline from '../../components/JourneyTimeline';
import MapView from '../../components/MapView';
import QRCodeModal from '../../components/QRCodeModal';
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
  const [processingNotes, setProcessingNotes] = useState('');
  const [timeline, setTimeline] = useState([]);
  
  // QR Modal state
  const [qrModal, setQrModal] = useState({
    isOpen: false
  });

  useEffect(() => {
    const loadBatch = async () => {
      try {
        console.log('🏭 Loading manufacturer batch details for ID:', batchId);
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
          navigate('/manufacturer/dashboard');
          return;
        }
        
        setBatch(batchData);
        setProcessingNotes(`Processed by ${user.name} on ${new Date().toLocaleDateString()}`);
        
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
        console.error('❌ Error loading manufacturer batch details:', error);
        showError('Failed to load batch details');
        navigate('/manufacturer/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (batchId) {
      loadBatch();
    }
  }, [batchId, navigate, showError, user.name, isConnected, service, account]);

  const handleMarkProcessed = async () => {
    setActionLoading(true);
    
    try {
      console.log(`🏭 Processing batch ${batchId}...`);
      
      if (isConnected && service) {
        // Generate QR code hash for the batch
        const qrCodeHash = `QR-${batchId}-${Date.now()}`;
        
        // Use blockchain service
        const result = await service.processBatch(parseInt(batchId), qrCodeHash);
        console.log('📥 Process result:', result);
        
        if (result.success) {
          showSuccess(`Batch ${batchId} processed successfully on blockchain`);
          
          // Get the updated batch data
          const updatedBatchResult = await service.getBatch(parseInt(batchId));
          if (updatedBatchResult.success) {
            setBatch(updatedBatchResult.data);
          }
        } else {
          throw new Error(result.error);
        }
      } else {
        // Fallback to local storage
        const updatedBatch = await markAsProcessed(batchId, processingNotes, user.name);
        setBatch(updatedBatch);
        showSuccess(`Batch ${batchId} marked as processed`);
      }
      
      // Show QR code modal
      setQrModal({ isOpen: true });
      
    } catch (error) {
      showError('Failed to mark batch as processed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShowQR = () => {
    setQrModal({ isOpen: true });
  };

  const handleCloseQRModal = () => {
    setQrModal({ isOpen: false });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
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
          onClick={() => navigate('/manufacturer/dashboard')}
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
          onClick={() => navigate('/manufacturer/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </button>
        
        <div className="flex space-x-3">
          {batch.status === 'Processed' && (
            <button
              onClick={handleShowQR}
              className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              <QrCode size={16} className="mr-2" />
              View QR Code
            </button>
          )}
          
          {batch.status === 'Approved' && (
            <button
              onClick={handleMarkProcessed}
              disabled={actionLoading}
              className="flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Package size={16} className="mr-2" />
              {actionLoading ? 'Processing...' : 'Mark as Processed'}
            </button>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manufacturing Details</h1>
        <p className="text-gray-600">
          Process approved batches and generate QR codes
          {isConnected && <span className="text-green-600"> • Blockchain Data</span>}
        </p>
      </div>

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
              <span className="font-medium text-gray-900">{batch.moisturePercent || batch.moisture}%</span>
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
            
            {batch.approvedAt && (
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Lab Approved</span>
                <span className="font-medium text-gray-900">{formatDateTime(batch.approvedAt)}</span>
              </div>
            )}
            
            {batch.processedAt && (
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Processed</span>
                <span className="font-medium text-gray-900">{formatDateTime(batch.processedAt)}</span>
              </div>
            )}
            
            {batch.qrCodeHash && (
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600 flex items-center">
                  <QrCode size={16} className="mr-1" />
                  QR Code
                </span>
                <span className="font-mono text-sm text-gray-900">{batch.qrCodeHash}</span>
              </div>
            )}
          </div>

          {/* Processing Notes */}
          {batch.status === 'Approved' && (
            <div className="mt-6">
              <label htmlFor="processingNotes" className="block text-sm font-medium text-gray-700 mb-2">
                Processing Notes
              </label>
              <textarea
                id="processingNotes"
                value={processingNotes}
                onChange={(e) => setProcessingNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="Add notes about the processing..."
              />
            </div>
          )}

          {/* Processing Notes Display */}
          {batch.processingNotes && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <FileText size={16} className="mr-2" />
                Processing Notes
              </h4>
              <p className="text-gray-600 text-sm bg-orange-50 p-3 rounded-lg">{batch.processingNotes}</p>
            </div>
          )}

          {/* Lab Approval Status */}
          {batch.status !== 'Pending' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">✅ Lab Approved</h4>
              <p className="text-sm text-green-700">
                This batch has passed quality testing and is ready for processing.
              </p>
            </div>
          )}
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
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Manufacturing Timeline</h2>
        
        <JourneyTimeline 
          timeline={timeline}
          currentStatus={batch.status}
        />
      </motion.div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={qrModal.isOpen}
        onClose={handleCloseQRModal}
        batch={batch}
      />
    </div>
  );
};

export default BatchDetails;