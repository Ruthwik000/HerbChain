import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  X, 
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import jsQR from 'jsqr';

// Extract batch ID from QR code URL or data
const extractBatchIdFromQRData = (qrData) => {
  try {
    console.log('🔍 QR Code data:', qrData);
    
    // Check if it's a URL containing batchId parameter
    if (qrData.includes('http') || qrData.includes('localhost')) {
      const urlObj = new URL(qrData);
      const batchId = urlObj.searchParams.get('batchId');
      console.log('📊 Extracted batch ID from URL:', batchId);
      return batchId;
    }
    
    // Check if it's just a batch ID (number)
    if (/^\d+$/.test(qrData.trim())) {
      console.log('📊 Direct batch ID:', qrData.trim());
      return qrData.trim();
    }
    
    // Check if it contains batch ID pattern
    const batchIdMatch = qrData.match(/batchId[=:](\d+)/i);
    if (batchIdMatch) {
      console.log('📊 Pattern matched batch ID:', batchIdMatch[1]);
      return batchIdMatch[1];
    }
    
    console.log('❌ Could not extract batch ID from:', qrData);
    return null;
  } catch (error) {
    console.error('❌ Error extracting batch ID:', error);
    return null;
  }
};

const QRScanner = ({ isOpen, onClose, onScan }) => {
  const [hasCamera, setHasCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [scanResult, setScanResult] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      checkCameraAvailability();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen]);

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasCamera(videoDevices.length > 0);
    } catch (err) {
      console.error('Error checking camera availability:', err);
      setHasCamera(false);
    }
  };

  const startCamera = async () => {
    try {
      setError('');
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          startQRScanning();
        };
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Unable to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  };

  const startQRScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    scanIntervalRef.current = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        scanQRCode();
      }
    }, 500); // Scan every 500ms
  };

  const scanQRCode = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
    
    if (qrCode) {
      console.log('✅ QR Code detected:', qrCode.data);
      const batchId = extractBatchIdFromQRData(qrCode.data);
      
      if (batchId) {
        handleQRDetected(batchId);
      } else {
        setError('QR code does not contain a valid batch ID');
      }
    }
  };

  const handleQRDetected = (batchId) => {
    stopCamera();
    setScanResult(batchId);
    setTimeout(() => {
      onScan(batchId);
      onClose();
    }, 1500);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to process the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get image data and scan for QR code
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (qrCode) {
          console.log('✅ QR Code detected in uploaded image:', qrCode.data);
          const batchId = extractBatchIdFromQRData(qrCode.data);
          
          if (batchId) {
            handleQRDetected(batchId);
          } else {
            setError('QR code does not contain a valid batch ID');
          }
        } else {
          setError('No QR code found in the uploaded image');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    scanQRCode(); // Manually trigger a scan
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Scan QR Code</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Success State */}
          {scanResult && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Code Detected!</h3>
              <p className="text-gray-600 mb-4">Batch ID: {scanResult}</p>
              <div className="flex items-center justify-center">
                <Loader className="w-5 h-5 text-blue-500 animate-spin mr-2" />
                <span className="text-blue-600">Loading batch details...</span>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Scanner Interface */}
          {!scanResult && (
            <div className="space-y-4">
              {/* Camera View */}
              {isScanning && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50">
                      <div className="absolute inset-0 border-2 border-green-400 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    Scanning for QR codes...
                  </div>
                </div>
              )}

              {/* Camera Controls */}
              {hasCamera && !isScanning && (
                <button
                  onClick={startCamera}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  <Camera size={20} className="mr-2" />
                  Start Camera
                </button>
              )}

              {isScanning && (
                <button
                  onClick={stopCamera}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Stop Camera
                </button>
              )}

              {/* File Upload */}
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  <Upload size={20} className="mr-2" />
                  Upload QR Image
                </button>
              </div>

              {/* Instructions */}
              <div className="text-center text-sm text-gray-500 space-y-1">
                <p>Position the QR code within the frame for automatic detection</p>
                <p>or upload an image containing the QR code</p>
                <p className="text-xs text-gray-400">QR code should contain batch ID or verification URL</p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QRScanner;