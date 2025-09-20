import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  Shield,
  ExternalLink,
  Clock
} from 'lucide-react';
import { getBatchById } from '../../services/dataService';
import { addToConsumerHistory } from '../../services/localStorageService';
import { useBlockchain } from '../../context/BlockchainContext';
import { useToast } from '../../components/ToastNotification';
import { formatDate } from '../../utils/formatDate';
import { getImage, getImageFromIPFS } from '../../services/imageService';

const BatchDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { isConnected, service } = useBlockchain();
  
  const batchId = searchParams.get('batchId');
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [dataSource, setDataSource] = useState(''); // 'blockchain' or 'local'
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    const loadBatch = async () => {
      if (!batchId) {
        showError('No batch ID provided');
        navigate('/consumer/trace');
        return;
      }

      try {
        console.log('🔍 Consumer loading batch details for ID:', batchId);
        console.log('  - isConnected:', isConnected);
        
        let batchData = null;
        let source = 'local';
        
        // Try blockchain first if connected
        if (isConnected && service) {
          console.log('📡 Fetching from blockchain...');
          try {
            const result = await service.getBatch(parseInt(batchId));
            console.log('📥 Blockchain result:', result);
            
            if (result.success) {
              batchData = result.data;
              source = 'blockchain';
              showSuccess('Loaded from blockchain!');
              console.log('✅ Batch loaded from blockchain:', batchData);
            }
          } catch (blockchainError) {
            console.log('⚠️ Blockchain fetch failed, trying local storage...');
          }
        }
        
        // Fallback to local storage
        if (!batchData) {
          console.log('📁 Falling back to local storage...');
          batchData = await getBatchById(batchId);
          if (batchData) {
            source = 'local';
            console.log('✅ Batch loaded from local storage:', batchData);
          }
        }
        
        if (!batchData) {
          showError('Batch not found');
          navigate('/consumer/trace');
          return;
        }
        
        setBatch(batchData);
        setDataSource(source);
        
        // Fetch timeline from blockchain if connected
        if (isConnected && service && source === 'blockchain') {
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
        
        // Add to consumer history
        addToConsumerHistory(batchId);
        
      } catch (error) {
        console.error('❌ Error loading batch details:', error);
        showError('Failed to load batch details');
        navigate('/consumer/trace');
      } finally {
        setLoading(false);
      }
    };

    loadBatch();
  }, [batchId, navigate, showError, showSuccess, isConnected, service]);

  const getAuthenticityStatus = (batch) => {
    if (!batch) return { status: 'unknown', message: 'Unknown', color: 'gray' };
    
    if (batch.status === 'Processed') {
      return { 
        status: 'authentic', 
        message: 'Verified Authentic', 
        color: 'green',
        icon: CheckCircle 
      };
    } else if (batch.status === 'Approved') {
      return { 
        status: 'approved', 
        message: 'Lab Approved', 
        color: 'blue',
        icon: Shield 
      };
    } else if (batch.status === 'Rejected') {
      return { 
        status: 'rejected', 
        message: 'Quality Issues', 
        color: 'red',
        icon: XCircle 
      };
    } else {
      return { 
        status: 'pending', 
        message: 'Under Review', 
        color: 'yellow',
        icon: AlertCircle 
      };
    }
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
        <p className="text-gray-500 mb-6">The requested batch could not be found or does not exist.</p>
        <button
          onClick={() => navigate('/consumer/trace')}
          className="btn-primary"
        >
          Try Another Batch
        </button>
      </div>
    );
  }

  const authenticity = getAuthenticityStatus(batch);
  const AuthIcon = authenticity.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/consumer/trace')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Batch Details</h1>
          <div className="w-16"></div>
        </div>

        {/* Product Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          {/* Batch ID */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500 mb-1">Batch ID</p>
            <p className="text-lg font-mono font-semibold text-gray-900">{batch.id}</p>
          </div>

          {/* Product Image */}
          {(() => {
            // Try to get image from local storage first
            const storedImage = batch.photoIpfsHash ? getImage(batch.photoIpfsHash) : null;
            
            if (batch.photoUrl && !imageError) {
              return (
                <div className="mb-6">
                  <img
                    src={batch.photoUrl}
                    alt={`${batch.herbName || batch.herb} batch ${batch.id}`}
                    className="w-full h-48 object-cover rounded-xl"
                    onError={() => setImageError(true)}
                  />
                </div>
              );
            } else if (storedImage && !imageError) {
              return (
                <div className="mb-6">
                  <img
                    src={storedImage}
                    alt={`${batch.herbName || batch.herb} batch ${batch.id}`}
                    className="w-full h-48 object-cover rounded-xl"
                    onError={() => setImageError(true)}
                  />
                </div>
              );
            }
            return null;
          })()}

          {/* Product Name */}
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{batch.herbName || batch.herb}</h2>
            <p className="text-gray-600">Organic • Premium Quality</p>
            {dataSource === 'blockchain' && (
              <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full mt-2">
                🔗 Verified on Blockchain
              </div>
            )}
          </div>

          {/* Authenticity Status */}
          <div className="text-center mb-6">
            <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-semibold ${
              authenticity.color === 'green' ? 'bg-green-100 text-green-800' :
              authenticity.color === 'blue' ? 'bg-blue-100 text-blue-800' :
              authenticity.color === 'red' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              <AuthIcon className="w-6 h-6 mr-2" />
              {authenticity.message}
            </div>
          </div>

          {/* Quality Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {(batch.moisturePercent || batch.moisture) <= 10 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Award size={12} className="mr-1" />
                Premium Quality
              </span>
            )}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              🌿 Organic
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              🤝 Fair Trade
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              🚫 Non-GMO
            </span>
          </div>
        </motion.div>

        {/* Journey Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Journey Timeline</h2>
          
          <div className="space-y-6">
            {timeline.length > 0 ? (
              // Display blockchain timeline if available
              timeline.map((stage, index) => {
                const getStageIcon = (stageName) => {
                  if (stageName.includes('Created')) return '🌱';
                  if (stageName.includes('Approved')) return '🧪';
                  if (stageName.includes('Rejected')) return '❌';
                  if (stageName.includes('Processed')) return '🏭';
                  return '📋';
                };
                
                const getStageColor = (status) => {
                  if (status === 'Completed') return 'text-green-500';
                  if (status === 'Rejected') return 'text-red-500';
                  return 'text-blue-500';
                };

                return (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 ${stage.status === 'Completed' ? 'bg-green-100' : stage.status === 'Rejected' ? 'bg-red-100' : 'bg-blue-100'} rounded-full flex items-center justify-center`}>
                        <span className="text-2xl">{getStageIcon(stage.stage)}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{stage.stage}</h3>
                      <p className="text-sm text-gray-600 mt-1">{stage.actor}</p>
                      <p className="text-sm text-gray-500">{stage.notes}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(stage.date)}</p>
                      {dataSource === 'blockchain' && (
                        <p className="text-xs text-blue-600 mt-1">Block #{stage.blockNumber}</p>
                      )}
                    </div>
                    <div className={getStageColor(stage.status)}>
                      {stage.status === 'Completed' ? <CheckCircle className="w-5 h-5" /> : 
                       stage.status === 'Rejected' ? <XCircle className="w-5 h-5" /> : 
                       <Clock className="w-5 h-5" />}
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback to static timeline for local data
              <>
                {/* Harvested */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🌱</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Harvested by Farmer</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {batch.farmer ? `${batch.farmer.substring(0, 6)}...${batch.farmer.substring(batch.farmer.length - 4)}` : 'Local Farmer'}
                    </p>
                    <p className="text-sm text-gray-500">{batch.location}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(batch.harvestDate)}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                </div>

                {/* Lab Approved */}
                {(batch.status === 'Approved' || batch.status === 'Processed') && (
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🧪</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Lab Approved</h3>
                      <p className="text-sm text-gray-600 mt-1">Quality checks passed</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(batch.approvedAt)}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                  </div>
                )}
              </>
            )}

            {/* Processed */}
            {batch.status === 'Processed' && (
              <>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🏭</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Processed by Manufacturer</h3>
                    <p className="text-sm text-gray-600 mt-1">{batch.processingNotes || 'Processed with care'}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(batch.processedAt)}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Product Packaged</h3>
                    <p className="text-sm text-gray-600 mt-1">Ready for distribution</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(batch.processedAt)}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🔗</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">QR Code Generated</h3>
                    <p className="text-sm text-gray-600 mt-1">Blockchain proof created</p>
                    <button className="text-xs text-blue-600 hover:text-blue-800 mt-1">
                      View on blockchain explorer →
                    </button>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                </div>
              </>
            )}

            {/* Rejected */}
            {batch.status === 'Rejected' && (
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">❌</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Quality Check Failed</h3>
                  <p className="text-sm text-gray-600 mt-1">{batch.rejectionReason}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(batch.rejectedAt)}</p>
                </div>
                <XCircle className="w-5 h-5 text-red-500 mt-1" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Farmer</span>
              <span className="font-medium text-gray-900">{batch.farmer}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Origin</span>
              <span className="font-medium text-gray-900">{batch.location}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Harvest Date</span>
              <span className="font-medium text-gray-900">{formatDate(batch.harvestDate)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Quality</span>
              <span className={`font-medium ${(batch.moisturePercent || batch.moisture) <= 10 ? 'text-green-600' : 'text-orange-600'}`}>
                {(batch.moisturePercent || batch.moisture) <= 10 ? 'Premium' : 'Standard'} ({batch.moisturePercent || batch.moisture}% moisture)
              </span>
            </div>
          </div>

          {batch.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="font-medium text-gray-900 mb-2">Processor Notes</h4>
              <p className="text-gray-600 text-sm">{batch.notes}</p>
            </div>
          )}
        </motion.div>

        {/* Blockchain Verification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Shield size={20} className={`mr-2 ${dataSource === 'blockchain' ? 'text-green-600' : 'text-gray-400'}`} />
                Blockchain Verification
              </h3>
              <span className="text-gray-400 group-open:rotate-180 transition-transform">
                ▼
              </span>
            </summary>
            
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
              {dataSource === 'blockchain' ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Data Source</span>
                    <span className="text-green-600 font-medium">✅ Blockchain</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Batch ID</span>
                    <span className="font-mono text-sm text-gray-900">{batch.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Farmer Address</span>
                    <span className="font-mono text-sm text-blue-600">
                      {batch.farmer ? `${batch.farmer.substring(0, 6)}...${batch.farmer.substring(batch.farmer.length - 4)}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Network</span>
                    <span className="text-sm text-gray-900">Hardhat Local</span>
                  </div>
                  <button 
                    className="w-full mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center"
                    onClick={() => window.open(`http://localhost:8545`, '_blank')}
                  >
                    View on Local Network <ExternalLink size={14} className="ml-1" />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Data Source</span>
                    <span className="text-orange-600 font-medium">📁 Local Storage</span>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm">
                      This batch data is stored locally. Connect to blockchain for verified data.
                    </p>
                  </div>
                  <button 
                    className="w-full mt-3 text-gray-500 text-sm font-medium cursor-not-allowed"
                    disabled
                  >
                    Blockchain verification not available
                  </button>
                </>
              )}
            </div>
          </details>
        </motion.div>
      </div>
    </div>
  );
};

export default BatchDetails;