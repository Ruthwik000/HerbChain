import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Upload, X, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createBatch } from '../../services/dataService';
import { validateBatchForm } from '../../utils/validateForm';
import { useToast } from '../../components/ToastNotification';

const CreateBatch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();
  
  const [formData, setFormData] = useState({
    herb: '',
    location: '',
    moisture: '',
    harvestDate: '',
    photo: null,
    notes: ''
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
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoChange = (e) => {
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
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
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
    
    const validation = validateBatchForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const batchData = {
        ...formData,
        farmer: user.name,
        farmerId: user.id,
        moisture: parseFloat(formData.moisture),
        // Convert photo to URL for storage (in real app, this would upload to server)
        photoUrl: photoPreview || null
      };
      
      // Remove the photo file from the data since we're using photoUrl
      delete batchData.photo;

      const newBatch = await createBatch(batchData);
      
      showSuccess(`Batch created successfully! ID: ${newBatch.id}`);
      navigate('/farmer/my-batches');
    } catch (error) {
      showError('Failed to create batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <label htmlFor="herb" className="block text-sm font-medium text-gray-700 mb-1">
              Herb Name *
            </label>
            <input
              type="text"
              id="herb"
              name="herb"
              value={formData.herb}
              onChange={handleChange}
              placeholder="e.g., Ashwagandha, Tulsi, Turmeric"
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50
                ${errors.herb ? 'border-red-300' : 'border-gray-300'}
              `}
              disabled={loading}
            />
            {errors.herb && (
              <p className="mt-1 text-sm text-red-600">{errors.herb}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter the name of the herb you are submitting
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
            <label htmlFor="moisture" className="block text-sm font-medium text-gray-700 mb-1">
              Moisture Content (%) *
            </label>
            <input
              type="number"
              id="moisture"
              name="moisture"
              value={formData.moisture}
              onChange={handleChange}
              placeholder="e.g., 8.5"
              step="0.1"
              min="0"
              max="15"
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50
                ${errors.moisture ? 'border-red-300' : 'border-gray-300'}
              `}
              disabled={loading}
            />
            {errors.moisture && (
              <p className="mt-1 text-sm text-red-600">{errors.moisture}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Optimal moisture content is below 10% for better quality
            </p>
          </div>

          {/* Harvest Date */}
          <div>
            <label htmlFor="harvestDate" className="block text-sm font-medium text-gray-700 mb-1">
              Harvest Date *
            </label>
            <input
              type="date"
              id="harvestDate"
              name="harvestDate"
              value={formData.harvestDate}
              onChange={handleChange}
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50
                ${errors.harvestDate ? 'border-red-300' : 'border-gray-300'}
              `}
              disabled={loading}
            />
            {errors.harvestDate && (
              <p className="mt-1 text-sm text-red-600">{errors.harvestDate}</p>
            )}
          </div>

          {/* Batch Photo */}
          <div>
            <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
              Batch Photo (Optional)
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
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
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
                  Photo selected. Click the × to remove and select a different photo.
                </p>
              </div>
            )}
            
            {errors.photo && (
              <p className="mt-1 text-sm text-red-600">{errors.photo}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional information about the batch..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50"
              disabled={loading}
            />
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
                'Create Batch'
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Tips Sidebar */}
      <div className="mt-8 card bg-green-50 border-green-200">
        <h3 className="font-semibold text-green-800 mb-2">💡 Tips for Better Approval</h3>
        <ul className="text-sm text-green-700 space-y-1">
          <li>• Keep moisture content below 10% for optimal quality</li>
          <li>• Provide accurate location information</li>
          <li>• Include clear photos of the herb batch</li>
          <li>• Add detailed notes about cultivation practices</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateBatch;