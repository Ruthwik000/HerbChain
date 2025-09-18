
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, User, Eye, Package } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/formatDate';

const BatchProcessingCard = ({ batch, onMarkProcessed, loading }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Batch Info */}
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-orange-600 font-bold text-lg">
              {batch.herb.charAt(0)}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <Link
                to={`/manufacturer/batch/${batch.id}`}
                className="text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors"
              >
                {batch.id}
              </Link>
              <StatusBadge status={batch.status} showApprovalInfo={true} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="font-medium text-gray-900">{batch.herb}</span>
              </div>
              <div className="flex items-center">
                <User size={14} className="mr-1" />
                <span>{batch.farmer}</span>
              </div>
              <div className="flex items-center">
                <MapPin size={14} className="mr-1" />
                <span>{batch.location}</span>
              </div>
              <div className="flex items-center">
                <Calendar size={14} className="mr-1" />
                <span>Approved: {formatDate(batch.approvedAt)}</span>
              </div>
            </div>
            
            <div className="mt-2 text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✅ Lab Approved
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 lg:flex-col lg:space-x-0 lg:space-y-2">
          <Link
            to={`/manufacturer/batch/${batch.id}`}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye size={16} className="mr-2" />
            View Details
          </Link>
          
          {batch.status === 'Approved' && (
            <button
              onClick={() => onMarkProcessed(batch.id)}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Package size={16} className="mr-2" />
              Mark as Processed
            </button>
          )}
          
          {batch.status === 'Processed' && (
            <div className="text-center">
              <span className="text-sm text-green-600 font-medium">✅ Processed</span>
              <p className="text-xs text-gray-500 mt-1">
                {formatDate(batch.processedAt)}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BatchProcessingCard;