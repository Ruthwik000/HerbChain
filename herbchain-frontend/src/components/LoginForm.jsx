import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Wallet } from 'lucide-react';
import { authenticateUser, authenticateMetaMaskUser } from '../services/localStorageService';
import { validateLoginForm } from '../utils/validateForm';
import { useBlockchain } from '../context/BlockchainContext';

const LoginForm = ({ selectedRole, onLogin, onError }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectingMetaMask, setConnectingMetaMask] = useState(false);
  
  const { connect, isConnected, isConnecting, account, userRole, getRoleDisplayName, refreshRole } = useBlockchain();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateLoginForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = authenticateUser(formData.username, formData.password);
      
      if (user && user.role === selectedRole) {
        onLogin(user);
      } else if (user) {
        onError(`Invalid role. Expected ${selectedRole}, but user is ${user.role}`);
      } else {
        onError('Invalid username or password');
      }
    } catch (error) {
      onError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoCredentials = {
      'Farmer': { username: 'farmer123', password: 'password123' },
      'Lab': { username: 'lab123', password: 'password123' },
      'Manufacturer': { username: 'manufacturer123', password: 'password123' }
    };

    const demo = demoCredentials[selectedRole];
    if (demo) {
      setFormData(demo);
    }
  };

  const handleMetaMaskConnect = async () => {
    setConnectingMetaMask(true);
    
    try {
      console.log('🔗 Starting MetaMask connection...');
      await connect();
      
      // Poll for role detection with multiple attempts
      let attempts = 0;
      const maxAttempts = 15; // 15 attempts over 7.5 seconds
      
      const pollForRole = () => {
        attempts++;
        console.log(`🔍 Attempt ${attempts}/${maxAttempts}: Checking connection and role...`);
        console.log('  - isConnected:', isConnected);
        console.log('  - account:', account);
        console.log('  - userRole:', userRole);
        
        if (isConnected && account && userRole && userRole !== 'consumer') {
          // Map selected role to expected blockchain role
          const roleMapping = {
            'Farmer': 'farmer',
            'Lab': 'lab_officer', 
            'Manufacturer': 'manufacturer'
          };
          
          const expectedRole = roleMapping[selectedRole];
          console.log('  - expectedRole:', expectedRole);
          console.log('  - actualRole:', userRole);
          
          if (userRole === expectedRole || userRole === 'admin') {
            console.log('✅ Role match! Creating user session...');
            // Create and save MetaMask user session
            const metaMaskUserData = {
              address: account,
              role: selectedRole,
              blockchainRole: userRole
            };
            const userSession = authenticateMetaMaskUser(metaMaskUserData);
            setConnectingMetaMask(false);
            onLogin(userSession);
            return;
          }
        }
        
        // If we have an account but wrong role, show error
        if (isConnected && account && userRole && userRole === 'consumer') {
          const expectedAccounts = {
            'Farmer': '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            'Lab': '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
            'Manufacturer': '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'
          };
          
          const expectedAccount = expectedAccounts[selectedRole];
          onError(`Wrong MetaMask account! Please switch to the ${selectedRole} account: ${expectedAccount}`);
          setConnectingMetaMask(false);
          return;
        }
        
        // Continue polling if we haven't reached max attempts
        if (attempts < maxAttempts) {
          setTimeout(pollForRole, 500);
        } else {
          onError('Connection timeout. Please ensure you have the correct MetaMask account selected and try again.');
          setConnectingMetaMask(false);
        }
      };
      
      // Start polling after initial connection
      setTimeout(pollForRole, 1000);
      
    } catch (error) {
      console.error('MetaMask connection error:', error);
      onError(`MetaMask connection failed: ${error.message}`);
      setConnectingMetaMask(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >
      <div className="card">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
            <span className="text-xl">
              {selectedRole === 'Farmer' ? '🌱' : selectedRole === 'Lab' ? '🧪' : '🏭'}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Login as {selectedRole}
          </h3>
          <p className="text-gray-600">
            Enter your credentials to access your dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`input-modern ${errors.username ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              placeholder="Enter your username"
              disabled={loading}
            />
            {errors.username && (
              <p className="form-error">{errors.username}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input-modern pr-12 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="form-error">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleMetaMaskConnect}
            disabled={loading || connectingMetaMask}
            className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
          >
            {connectingMetaMask ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting to MetaMask...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-5 w-5" />
                Connect with MetaMask
              </>
            )}
          </button>
          
          {isConnected && account && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-sm text-green-800 font-medium">
                Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </p>
              <p className="text-sm text-green-700">Role: {getRoleDisplayName(userRole)}</p>
              {userRole === 'consumer' && (
                <button
                  onClick={refreshRole}
                  className="mt-2 text-green-600 hover:text-green-800 underline text-sm font-medium"
                >
                  Refresh Role
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full btn-secondary"
            disabled={loading || connectingMetaMask}
          >
            Use Demo Account
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-center">
          <p className="text-sm text-gray-600 mb-2">Demo credentials:</p>
          <p className="font-mono text-xs text-gray-700">
            {selectedRole.toLowerCase()}123 / password123
          </p>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
          <p className="font-semibold text-blue-800 mb-2">MetaMask Account for {selectedRole}:</p>
          <p className="font-mono text-blue-700">
            {selectedRole === 'Farmer' && '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'}
            {selectedRole === 'Lab' && '0x90F79bf6EB2c4f870365E785982E1f101E93b906'}
            {selectedRole === 'Manufacturer' && '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65'}
          </p>
          <p className="text-blue-600 mt-1">
            Make sure this account is selected in MetaMask before connecting.
          </p>
        </div>
        

      </div>
    </motion.div>
  );
};

export default LoginForm;