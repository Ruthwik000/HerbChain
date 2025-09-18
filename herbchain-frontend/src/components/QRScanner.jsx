import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ToastNotification';

const QRScanner = ({ isOpen, onClose }) => {
  const [scanMode, setScanMode] = useState(null); // 'camera' or 'upload'
  const [stream, setStream] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const { showSuccess } = useToast();

  // Mock QR code detection function
  const detectQRCode = () => {
    // In a real implementation, you would use a QR code detection library
    // For demo purposes, we'll simulate QR code detection
    const mockQRCodes = [
      'ASH-2025-001',
      'TUL-2025-002', 
      'TUR-2025-003'
    ];
    
    // Simulate detection delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Randomly return one of the mock QR codes or null
        const detected = Math.random() > 0.3 ? mockQRCodes[Math.floor(Math.random() * mockQRCodes.length)] : null;
        resolve(detected);
      }, 1000);
    });
  };

  const startCamera = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      setScanMode('camera');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      if (error.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permissions and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Unable to access camera. Please try uploading a photo instead.');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanMode(null);
  };

  const scanFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setScanning(true);
    setError('');
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const qrCode = await detectQRCode();
      
      if (qrCode) {
        showSuccess(`QR Code detected: ${qrCode}`);
        navigate(`/consumer/batch?batchId=${qrCode}`);
        handleClose();
      } else {
        setError('No QR code detected. Please try again or ensure the QR code is clearly visible.');
      }
    } catch (error) {
      setError('Failed to scan QR code. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    
    setScanning(true);
    setError('');
    
    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        
        const qrCode = await detectQRCode();
        
        if (qrCode) {
          showSuccess(`QR Code detected: ${qrCode}`);
          navigate(`/consumer/batch?batchId=${qrCode}`);
          handleClose();
        } else {
          setError('No QR code detected in the image. Please try a different image.');
        }
        setScanning(false);
      };
      
      img.onerror = () => {
        setError('Failed to load image. Please try a different file.');
        setScanning(false);
      };
      
      img.src = URL.createObjectURL(file);
    } catch (error) {
      setError('Failed to process image. Please try again.');
      setScanning(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setScanMode(null);
    setError('');
    setScanning(false);
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Scan QR Code
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {!scanMode ? (
                /* Mode Selection */
                <div className="space-y-4">
                  <p className="text-gray-600 text-center mb-6">
                    Choose how you want to scan the QR code
                  </p>
                  
                  <button
                    onClick={startCamera}
                    className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-green-600 mr-3" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Use Camera</div>
                      <div className="text-sm text-gray-500">Scan QR code with camera</div>
                    </div>
                  </button>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={scanning}
                    />
                    <div className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 text-green-600 mr-3" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Upload Photo</div>
                        <div className="text-sm text-gray-500">Select image with QR code</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : scanMode === 'camera' ? (
                /* Camera View */
                <div className="space-y-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 bg-black rounded-lg object-cover"
                    />
                    
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-green-500 rounded-lg">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={stopCamera}
                      className="flex-1 btn-secondary"
                      disabled={scanning}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={scanFromCamera}
                      disabled={scanning}
                      className="flex-1 btn-primary flex items-center justify-center"
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        'Scan QR Code'
                      )}
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Position the QR code within the frame and tap scan
                  </p>
                </div>
              ) : null}
              
              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              {/* Loading State for Upload */}
              {scanning && scanMode !== 'camera' && (
                <div className="mt-4 flex items-center justify-center p-4">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin text-green-500" />
                  <span className="text-gray-600">Processing image...</span>
                </div>
              )}
            </div>
            
            {/* Hidden canvas for image processing */}
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default QRScanner;