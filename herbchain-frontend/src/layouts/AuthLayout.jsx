
import { motion } from 'framer-motion';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl">🌿</span>
            </div>
            <span className="ml-2 text-2xl font-bold text-green-800">HerbChain</span>
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            HerbChain Traceability
          </h1>
          <p className="text-gray-600">
            Trace Ayurvedic herbs through the supply chain
          </p>
        </div>

        {/* Main Content */}
        <div className="flex justify-center">
          {children}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">About</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Help</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Privacy</a>
          </div>
          <p className="text-xs text-gray-400">© 2025 HerbChain. All rights reserved.</p>
        </footer>
      </motion.div>
    </div>
  );
};

export default AuthLayout;