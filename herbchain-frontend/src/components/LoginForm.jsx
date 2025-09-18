import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authenticateUser } from '../services/localStorageService';
import { validateLoginForm } from '../utils/validateForm';

const LoginForm = ({ selectedRole, onLogin, onError }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md"
    >
      <div className="card">
        <div className="mb-6 text-center">
          <h3 className="text-xl font-semibold text-gray-900">
            Login as {selectedRole}
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Enter your credentials to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50
                ${errors.username ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Enter username"
              disabled={loading}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`
                  w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50
                  ${errors.password ? 'border-red-300' : 'border-gray-300'}
                `}
                placeholder="Enter password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleDemoLogin}
            className="w-full btn-secondary"
            disabled={loading}
          >
            Use Demo Account
          </button>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Demo credentials:</p>
          <p className="font-mono text-xs">
            {selectedRole.toLowerCase()}123 / password123
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginForm;