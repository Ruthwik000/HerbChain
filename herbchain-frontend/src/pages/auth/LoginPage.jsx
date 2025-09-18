import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastNotification';
import RoleCard from '../../components/RoleCard';
import LoginForm from '../../components/LoginForm';

const LoginPage = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();

  const roles = [
    {
      role: 'Farmer',
      icon: '🌱',
      label: 'Farmer',
      description: 'Create and track herb batches'
    },
    {
      role: 'Lab',
      icon: '🧪',
      label: 'Lab / QA',
      description: 'Validate batches with quality testing'
    },
    {
      role: 'Manufacturer',
      icon: '🏭',
      label: 'Manufacturer',
      description: 'Process approved batches and generate QR codes'
    },
    {
      role: 'Consumer',
      icon: '👤',
      label: 'Consumer',
      description: 'Verify authenticity via batch ID or QR'
    }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    
    if (role === 'Consumer') {
      // Consumer doesn't need authentication
      navigate('/consumer/trace');
    } else {
      setShowLoginForm(true);
    }
  };

  const handleLogin = (userData) => {
    login(userData);
    showSuccess(`Welcome back, ${userData.name}!`);
    
    // Redirect based on role
    const roleRoutes = {
      'Farmer': '/farmer/dashboard',
      'Lab': '/lab/dashboard',
      'Manufacturer': '/manufacturer/dashboard'
    };
    
    navigate(roleRoutes[userData.role] || '/');
  };

  const handleLoginError = (error) => {
    showError(error);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setShowLoginForm(false);
  };

  return (
    <div className="w-full max-w-4xl">
      {!showLoginForm ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Role Selection */}
          <div className="card max-w-4xl mx-auto p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Select Your Role
              </h2>
              <p className="text-gray-600">
                Choose your role to access the appropriate interface
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roles.map((roleData) => (
                <RoleCard
                  key={roleData.role}
                  role={roleData.role}
                  icon={roleData.icon}
                  label={roleData.label}
                  description={roleData.description}
                  isSelected={selectedRole === roleData.role}
                  onClick={handleRoleSelect}
                />
              ))}
            </div>

            {selectedRole && selectedRole !== 'Consumer' && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Selected: <span className="font-medium text-green-600">{selectedRole}</span>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center">
          <button
            onClick={handleBack}
            className="self-start mb-4 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to role selection
          </button>
          
          <LoginForm
            selectedRole={selectedRole}
            onLogin={handleLogin}
            onError={handleLoginError}
          />
        </div>
      )}
    </div>
  );
};

export default LoginPage;