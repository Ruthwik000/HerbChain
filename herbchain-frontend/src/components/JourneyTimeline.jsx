
import { CheckCircle, Clock, XCircle, Package } from 'lucide-react';
import { formatDateTime } from '../utils/formatDate';

const JourneyTimeline = ({ timeline, currentStatus }) => {
  const getStageIcon = (stage, status) => {
    if (status === 'Completed') {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    } else if (status === 'Rejected') {
      return <XCircle className="w-6 h-6 text-red-500" />;
    } else if (status === 'Current') {
      return <Clock className="w-6 h-6 text-blue-500" />;
    } else {
      return <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white" />;
    }
  };

  const getStageColor = (stage, status) => {
    if (status === 'Completed') return 'text-green-600';
    if (status === 'Rejected') return 'text-red-600';
    if (status === 'Current') return 'text-blue-600';
    return 'text-gray-400';
  };

  const getConnectorColor = (index, timeline) => {
    if (index === timeline.length - 1) return 'transparent';
    const currentStage = timeline[index];
    if (currentStage.status === 'Completed') return 'bg-green-200';
    return 'bg-gray-200';
  };

  return (
    <div className="space-y-4">
      {timeline.map((stage, index) => (
        <div key={index} className="relative flex items-start space-x-4">
          {/* Timeline connector */}
          {index < timeline.length - 1 && (
            <div 
              className={`absolute left-3 top-8 w-0.5 h-16 ${getConnectorColor(index, timeline)}`}
            />
          )}
          
          {/* Stage icon */}
          <div className="flex-shrink-0 relative z-10">
            {getStageIcon(stage.stage, stage.status)}
          </div>
          
          {/* Stage content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-medium ${getStageColor(stage.stage, stage.status)}`}>
                {stage.stage}
              </h4>
              {stage.date && (
                <span className="text-xs text-gray-500">
                  {formatDateTime(stage.date)}
                </span>
              )}
            </div>
            
            {stage.actor && (
              <p className="text-sm text-gray-600 mt-1">
                {stage.actor}
              </p>
            )}
            
            {stage.notes && (
              <p className="text-sm text-gray-500 mt-1">
                {stage.notes}
              </p>
            )}
            
            {stage.blockNumber && (
              <p className="text-xs text-blue-600 mt-1 font-mono">
                Block #{stage.blockNumber}
              </p>
            )}
            
            {stage.transactionHash && (
              <p className="text-xs text-gray-400 mt-1 font-mono">
                Tx: {stage.transactionHash.substring(0, 10)}...
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default JourneyTimeline;