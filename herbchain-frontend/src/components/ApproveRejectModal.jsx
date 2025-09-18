import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

const ApproveRejectModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  batch, 
  action, // 'approve' or 'reject'
  loading 
}) => {
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (action === 'reject' && !reason.trim()) {
      setErrors({ reason: 'Rejection reason is required' });
      return;
    }
    
    setErrors({});
    onConfirm(batch?.id, reason.trim());
  };

  const handleClose = () => {
    setReason('');
    setErrors({});
    onClose();
  };

  if (!isOpen || !batch) return null;

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
              <div className="flex items-center space-x-3">
                {action === 'approve' ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {action === 'approve' ? 'Approve Batch' : 'Reject Batch'}
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  {action === 'approve' 
                    ? 'Are you sure you want to approve this batch?' 
                    : 'Are you sure you want to reject this batch?'
                  }
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-900">{batch.id}</p>
                  <p className="text-sm text-gray-600">{batch.herb} • {batch.farmer}</p>
                </div>
              </div>

              {action === 'reject' && (
                <div className="mb-6">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (errors.reason) setErrors({});
                    }}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
                      errors.reason ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Please provide a detailed reason for rejection..."
                    disabled={loading}
                  />
                  {errors.reason && (
                    <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
                  )}
                </div>
              )}

              {action === 'approve' && (
                <div className="mb-6">
                  <label htmlFor="approvalNotes" className="block text-sm font-medium text-gray-700 mb-2">
                    Approval Notes (Optional)
                  </label>
                  <textarea
                    id="approvalNotes"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    placeholder="Any additional notes about the approval..."
                    disabled={loading}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-4 py-2 text-white font-medium rounded-lg transition-colors ${
                    action === 'approve'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  } disabled:opacity-50`}
                >
                  {loading ? 'Processing...' : (action === 'approve' ? 'Approve' : 'Reject')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ApproveRejectModal;