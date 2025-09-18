
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Droplets, User, Eye } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/formatDate';

const BatchReviewCard = ({ batch, onApprove, onReject, loading }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Batch Info */}
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-green-600 font-bold text-lg">
              {batch.herb.charAt(0)}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <Link
                to={`/lab/batch/${batch.id}`}
                className="text-lg font-semibold text-gray-900 hover:text-green-600 transition-colors"
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
                <span>{formatDate(batch.createdAt)}</span>
              </div>
            </div>
            
            <div className="mt-2 flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <Droplets size={14} className="mr-1 text-blue-500" />
                <span className={batch.moisture > 10 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                  {batch.moisture}% moisture
                </span>
              </div>
              {batch.moisture > 10 && (
                <span className="text-orange-600 text-xs">⚠️ High moisture</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 lg:flex-col lg:space-x-0 lg:space-y-2">
          <Link
            to={`/lab/batch/${batch.id}`}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye size={16} className="mr-2" />
            View Details
          </Link>
          
          {batch.status === 'Pending' && (
            <div className="flex space-x-2">
              <button
                onClick={() => onApprove(batch.id)}
                disabled={loading}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(batch.id)}
                disabled={loading}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BatchReviewCard;