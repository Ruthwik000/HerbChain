import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Droplets, 
  Image as ImageIcon,
  FileText,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { getBatchById } from '../../services/dataService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastNotification';
import StatusBadge from '../../components/StatusBadge';
import JourneyTimeline from '../../components/JourneyTimeline';
import MapView from '../../components/MapView';
import { formatDate, formatDateTime } from '../../utils/formatDate';

const BatchDetails = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useToast();
  
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadBatch = async () => {
      try {
        const batchData = await getBatchById(batchId);
        if (!batchData) {
          showError('Batch not found');
          navigate('/farmer/my-batches');
          return;
        }
        
        // Check if user owns this batch
        if (batchData.farmerId !== user.id) {
          showError('You do not have permission to view this batch');
          navigate('/farmer/my-batches');
          return;
        }
        
        setBatch(batchData);
      } catch (error) {
        showError('Failed to load batch details');
        navigate('/farmer/my-batches');
      } finally {
        setLoading(false);
      }
    };

    if (batchId) {
      loadBatch();
    }
  }, [batchId, user.id, navigate, showError]);

  const handleResubmit = () => {
    // Navigate to create batch page with pre-filled data
    navigate('/farmer/create-batch', { 
      state: { 
        resubmitData: {
          herb: batch.herb,
          location: batch.location,
          moisture: batch.moisture,
          harvestDate: batch.harvestDate,
          photoUrl: batch.photoUrl, // This will be converted back to photo preview in CreateBatch
          notes: batch.notes
        }
      }
    });
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
          onClick={() => navigate('/farmer/my-batches')}
          className="btn-primary"
        >
          Back to My Batches
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/farmer/my-batches')}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to My Batches
        </button>
        
        {batch.status === 'Rejected' && (
          <button
            onClick={handleResubmit}
            className="btn-primary flex items-center"
          >
            <RefreshCw size={16} className="mr-2" />
            Resubmit Batch
          </button>
        )}
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Batch Details</h1>
        <p className="text-gray-600">Complete information about your herb batch</p>
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
              <span className="font-medium text-gray-900">{batch.herb}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600">Status</span>
              <StatusBadge status={batch.status} />
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
              <span className="text-gray-600">Created</span>
              <span className="font-medium text-gray-900">{formatDateTime(batch.createdAt)}</span>
            </div>
          </div>

          {/* Rejection Reason */}
          {batch.status === 'Rejected' && batch.rejectionReason && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2 flex items-center">
                <AlertCircle size={16} className="mr-2" />
                Rejection Reason
              </h4>
              <p className="text-red-700 text-sm">{batch.rejectionReason}</p>
            </div>
          )}

          {/* Notes */}
          {batch.notes && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <FileText size={16} className="mr-2" />
                Notes
              </h4>
              <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">{batch.notes}</p>
            </div>
          )}
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
              Location
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
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Status Timeline</h2>
        
        <JourneyTimeline 
          timeline={batch.timeline || []}
          currentStatus={batch.status}
        />
      </motion.div>
    </div>
  );
};

export default BatchDetails;