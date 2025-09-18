

const StatusBadge = ({ status, showApprovalInfo = false }) => {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return {
          className: 'status-pending',
          emoji: '🟡',
          text: 'Pending'
        };
      case 'approved':
        return {
          className: 'status-approved',
          emoji: '✅',
          text: 'Approved'
        };
      case 'rejected':
        return {
          className: 'status-rejected',
          emoji: '❌',
          text: 'Rejected'
        };
      case 'processed':
        return {
          className: 'status-processing',
          emoji: '📦',
          text: showApprovalInfo ? 'Processed (Approved)' : 'Processed'
        };
      default:
        return {
          className: 'status-badge bg-gray-100 text-gray-800',
          emoji: '⚪',
          text: status || 'Unknown'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={config.className}>
      <span className="mr-1">{config.emoji}</span>
      {config.text}
    </span>
  );
};

export default StatusBadge;