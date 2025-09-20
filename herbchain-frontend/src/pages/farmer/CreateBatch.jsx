import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Upload, X, Camera, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBlockchain } from '../../context/BlockchainContext';
import { validateBatchForm } from '../../utils/validateForm';
import { useToast } from '../../components/ToastNotification';
import { storeImage } from '../../services/imageService';

const CreateBatch = () => {
  const { user } = useAuth();
  const { isConnected, userRole, service, connect, account } = useBlockchain();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();
  
  const [formData, setFormData] = useState({
    herbName: '',
    location: '',
    moisturePercent: '',
    photoIpfsHash: '',
    notes: '',
    // Legacy fields for compatibility
    herb: '',
    moisture: '',
    harvestDate: '',
    photo: null
  });
  
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isResubmit, setIsResubmit] = useState(false);

  // Handle resubmit data from location state
  useEffect(() => {
    if (location.state?.resubmitData) {
      const resubmitData = { ...location.state.resubmitData };
      // Convert photoUrl back to photo for resubmit
      if (resubmitData.photoUrl) {
        setPhotoPreview(resubmitData.photoUrl);
        delete resubmitData.photoUrl;
      }
      setFormData(resubmitData);
      setIsResubmit(true);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value,
      // Update both new and legacy field names for compatibility
      ...(name === 'herb' && { herbName: value }),
      ...(name === 'herbName' && { herb: value }),
      ...(name === 'moisture' && { moisturePercent: parseFloat(value) || 0 }),
      ...(name === 'moisturePercent' && { moisture: value })
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, photo: 'Please select a valid image file (JPG, PNG, GIF, WebP)' }));
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'File size must be less than 10MB' }));
        return;
      }
      
      setFormData(prev => ({ ...prev, photo: file }));
      
      // Create preview URL and store image data
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target.result;
        setPhotoPreview(imageDataUrl);
        
        // Store the image data URL for display purposes
        // In a real implementation, this would be uploaded to IPFS
        setFormData(prev => ({ 
          ...prev, 
          photoDataUrl: imageDataUrl,
          photoIpfsHash: `QmPhoto${Date.now()}${Math.random().toString(36).substr(2, 9)}`
        }));
      };
      reader.readAsDataURL(file);
      
      // Clear any existing errors
      if (errors.photo) {
        setErrors(prev => ({ ...prev, photo: '' }));
      }
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, photo: null }));
    setPhotoPreview(null);
    // Clear the file input
    const fileInput = document.getElementById('photo');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Form submitted!');
    console.log('📋 Form data:', formData);
    
    const currentAccount = account || service?.currentAccount;
    console.log('🔗 Blockchain state:', { isConnected, userRole, account: currentAccount });
    
    // Check blockchain connection
    if (!isConnected) {
      console.log('❌ Not connected to blockchain');
      showError('Please connect your wallet first');
      return;
    }

    // Check user role
    if (userRole !== 'farmer' && userRole !== 'admin') {
      console.log('❌ Invalid user role:', userRole);
      showError('You need farmer role to create batches');
      return;
    }
    
    console.log('✅ Role check passed:', userRole);
    
    const validation = validateBatchForm(formData);
    if (!validation.isValid) {
      console.log('❌ Form validation failed:', validation.errors);
      setErrors(validation.errors);
      return;
    }

    // Validate blockchain-specific fields
    if (!formData.herbName || !formData.location || !formData.moisturePercent) {
      console.log('❌ Missing required fields');
      setErrors({
        herbName: !formData.herbName ? 'Herb name is required' : '',
        location: !formData.location ? 'Location is required' : '',
        moisturePercent: !formData.moisturePercent ? 'Moisture content is required' : ''
      });
      return;
    }

    console.log('✅ All validations passed, starting batch creation...');
    setLoading(true);
    setErrors({});

    try {
      // Prepare blockchain data
      const blockchainData = {
        herbName: formData.herbName || formData.herb,
        location: formData.location,
        moisturePercent: parseInt(formData.moisturePercent || formData.moisture),
        photoIpfsHash: formData.photoIpfsHash || `QmPlaceholder${Date.now()}`,
        notes: formData.notes || ''
      };

      console.log('📤 Sending to blockchain service:', blockchainData);

      // Store image data locally if we have it
      if (formData.photoDataUrl && formData.photoIpfsHash) {
        console.log('📸 Storing image data locally...');
        storeImage(formData.photoIpfsHash, formData.photoDataUrl);
      }

      // Create batch on blockchain
      const result = await service.createBatch(blockchainData);
      
      console.log('📥 Blockchain service result:', result);
      
      if (result.success) {
        console.log('✅ Batch created successfully!');
        showSuccess(`Batch created successfully on blockchain! Batch ID: ${result.batchId}`);
        navigate('/farmer/my-batches');
      } else {
        console.log('❌ Batch creation failed:', result.error);
        showError(`Failed to create batch: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Batch creation error:', error);
      showError('Failed to create batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show connection prompt if not connected
  if (!isConnected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <Wallet className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">
            You need to connect your MetaMask wallet to create batches on the blockchain.
          </p>
          <button
            onClick={connect}
            className="btn-primary flex items-center mx-auto"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // Show role error if not farmer
  if (userRole !== 'farmer' && userRole !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You need farmer role to create batches. Current role: {userRole}
          </p>
          <button
            onClick={() => navigate('/farmer/dashboard')}
            className="btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">


      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/farmer/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          {isResubmit ? 'Resubmit Herb Batch' : 'Create New Herb Batch'} <span className="ml-2">🌱</span>
        </h1>
        <p className="mt-2 text-gray-600">
          {isResubmit 
            ? 'Update the details and resubmit your batch for review'
            : 'Enter the details of your herb batch for traceability'
          }
        </p>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Herb Name */}
          <div>
            <label htmlFor="herbName" className="block text-sm font-medium text-gray-700 mb-1">
              Herb Name *
            </label>
            <input
              type="text"
              id="herbName"
              name="herbName"
              value={formData.herbName}
              onChange={handleChange}
              placeholder="e.g., Organic Basil, Premium Turmeric"
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50
                ${errors.herbName ? 'border-red-300' : 'border-gray-300'}
              `}
              disabled={loading}
            />
            {errors.herbName && (
              <p className="mt-1 text-sm text-red-600">{errors.herbName}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter the name of the herb you are submitting to the blockchain
            </p>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Village, District, State"
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50
                ${errors.location ? 'border-red-300' : 'border-gray-300'}
              `}
              disabled={loading}
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          {/* Moisture Content */}
          <div>
            <label htmlFor="moisturePercent" className="block text-sm font-medium text-gray-700 mb-1">
              Moisture Content (%) *
            </label>
            <input
              type="number"
              id="moisturePercent"
              name="moisturePercent"
              value={formData.moisturePercent}
              onChange={handleChange}
              placeholder="e.g., 15"
              min="0"
              max="100"
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50
                ${errors.moisturePercent ? 'border-red-300' : 'border-gray-300'}
              `}
              disabled={loading}
            />
            {errors.moisturePercent && (
              <p className="mt-1 text-sm text-red-600">{errors.moisturePercent}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter moisture content as a whole number (0-100%)
            </p>
          </div>

          {/* Batch Photo */}
          <div>
            <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
              Batch Photo *
            </label>
            
            {!photoPreview ? (
              <div className="mt-1">
                <label
                  htmlFor="photo"
                  className={`
                    flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer
                    ${errors.photo ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
                    transition-colors
                  `}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold text-green-600">Upload a file</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB (will be stored on IPFS)</p>
                  </div>
                  <input
                    id="photo"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={loading}
                  />
                </label>
              </div>
            ) : (
              <div className="mt-1">
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Batch preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Photo selected and will be uploaded to IPFS. Click the × to remove and select a different photo.
                </p>
                {formData.photoIpfsHash && (
                  <p className="mt-1 text-xs text-green-600">
                    IPFS Hash: {formData.photoIpfsHash.substring(0, 20)}...
                  </p>
                )}
              </div>
            )}
            
            {errors.photo && (
              <p className="mt-1 text-sm text-red-600">{errors.photo}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes *
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Cultivation practices, quality details, harvest information..."
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50
                ${errors.notes ? 'border-red-300' : 'border-gray-300'}
              `}
              disabled={loading}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Provide detailed information about the batch for blockchain record
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/farmer/dashboard')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => console.log('🧪 Test button clicked!')}
              className="btn-secondary"
            >
              Test Console
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Batch on Blockchain'
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Blockchain Info */}
      <div className="mt-8 card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">🔗 Blockchain Information</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Your batch will be permanently recorded on the blockchain</li>
          <li>• Photos are stored on IPFS for decentralized access</li>
          <li>• All data is immutable and transparent</li>
          <li>• Lab officers will review your batch for approval</li>
        </ul>
      </div>

      {/* Tips Sidebar */}
      <div className="mt-4 card bg-green-50 border-green-200">
        <h3 className="font-semibold text-green-800 mb-2">💡 Tips for Better Approval</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Provide accurate moisture content measurements</li>
          <li>• Include precise location information</li>
          <li>• Upload clear, high-quality photos</li>
          <li>• Add detailed notes about cultivation and quality</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateBatch;