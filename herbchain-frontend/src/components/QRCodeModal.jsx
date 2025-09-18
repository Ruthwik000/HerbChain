import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Share2, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from './ToastNotification';

const QRCodeModal = ({ isOpen, onClose, batch }) => {
  const { showSuccess } = useToast();
  
  if (!isOpen || !batch) return null;

  const qrValue = `${window.location.origin}/consumer/batch?batchId=${batch.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      showSuccess('Link copied to clipboard');
    } catch (error) {
      showSuccess('Link: ' + qrValue);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = 200;
    canvas.height = 200;
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${batch.id}-qr-code.png`;
      link.href = url;
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `HerbChain - ${batch.herb} Batch ${batch.id}`,
          text: `Verify the authenticity of this ${batch.herb} batch`,
          url: qrValue
        });
      } catch (error) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
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
                QR Code Generated
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 text-center">
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  QR Code for batch verification
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-900">{batch.id}</p>
                  <p className="text-sm text-gray-600">{batch.herb}</p>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <QRCodeSVG
                    id="qr-code"
                    value={qrValue}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
              </div>

              {/* Consumer URL */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Consumer verification link:</p>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-xs font-mono text-gray-700 break-all">
                    {qrValue}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleDownloadQR}
                  className="flex flex-col items-center p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Download size={20} className="mb-1" />
                  <span className="text-xs">Download</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Share2 size={20} className="mb-1" />
                  <span className="text-xs">Share</span>
                </button>
                
                <button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Copy size={20} className="mb-1" />
                  <span className="text-xs">Copy Link</span>
                </button>
              </div>

              <div className="mt-6">
                <button
                  onClick={onClose}
                  className="w-full btn-primary"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default QRCodeModal;