
import { motion } from 'framer-motion';

const RoleCard = ({ role, icon, label, description, isSelected, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        cursor-pointer rounded-xl border-2 p-6 transition-all duration-200
        ${isSelected 
          ? 'border-green-500 bg-green-50 shadow-lg' 
          : 'border-gray-200 bg-white hover:border-green-500 hover:shadow-md'
        }
      `}
      onClick={() => onClick(role)}
      role="button"
      tabIndex={0}
      aria-label={`Select ${label} role`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(role);
        }
      }}
    >
      <div className="text-center">
        <div className="mb-4 text-4xl">{icon}</div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">{label}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
};

export default RoleCard;