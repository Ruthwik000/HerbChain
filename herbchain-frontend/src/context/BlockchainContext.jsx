import React, { createContext, useContext, useState, useEffect } from 'react';
import blockchainService from '../services/blockchainService';

const BlockchainContext = createContext();

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
};

export const BlockchainProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Connect to blockchain
  const connect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await blockchainService.initialize();
      
      if (result.success) {
        setIsConnected(true);
        setAccount(result.account);
        
        // Wait a moment and then determine role again to ensure it's correct
        setTimeout(async () => {
          try {
            const role = await blockchainService.determineUserRole();
            console.log('🔄 Role re-determined after connection:', role);
            setUserRole(role || blockchainService.currentRole);
          } catch (error) {
            console.error('Failed to re-determine role:', error);
            setUserRole(result.role);
          }
        }, 500);
        
        setUserRole(result.role);
        
        // Get account balance
        const balanceResult = await blockchainService.getAccountBalance();
        if (balanceResult.success) {
          setBalance(balanceResult.balance);
        }

        // Setup event listeners
        setupEventListeners();
        
        addNotification('success', 'Successfully connected to HerbChain!');
      } else {
        setError(result.error);
        addNotification('error', `Connection failed: ${result.error}`);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to connect to blockchain';
      setError(errorMessage);
      addNotification('error', errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from blockchain
  const disconnect = () => {
    blockchainService.disconnect();
    setIsConnected(false);
    setAccount(null);
    setUserRole(null);
    setBalance(null);
    setError(null);
    addNotification('info', 'Disconnected from HerbChain');
  };

  // Setup event listeners for real-time updates
  const setupEventListeners = () => {
    blockchainService.setupEventListeners({
      onBatchCreated: (data) => {
        addNotification('success', `New batch created: ${data.herbName}`);
      },
      onBatchApproved: (data) => {
        addNotification('success', `Batch #${data.batchId} approved`);
      },
      onBatchRejected: (data) => {
        addNotification('warning', `Batch #${data.batchId} rejected`);
      },
      onBatchProcessed: (data) => {
        addNotification('success', `Batch #${data.batchId} processed`);
      }
    });
  };

  // Add notification
  const addNotification = (type, message) => {
    const notification = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 notifications

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== account) {
          // Reconnect with new account
          connect();
        }
      };

      const handleChainChanged = () => {
        // Reconnect on network change
        connect();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account]);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connect();
          }
        } catch (error) {
          console.log('Auto-connect failed:', error);
        }
      }
    };

    autoConnect();
  }, []);

  // Refresh role detection
  const refreshRole = async () => {
    if (isConnected && blockchainService.herbChainContract && blockchainService.currentAccount) {
      try {
        const role = await blockchainService.determineUserRole();
        setUserRole(role || blockchainService.currentRole);
        addNotification('success', 'Role refreshed successfully');
      } catch (error) {
        addNotification('error', `Failed to refresh role: ${error.message}`);
      }
    }
  };

  const value = {
    // Connection state
    isConnected,
    isConnecting,
    account,
    userRole,
    balance,
    error,
    
    // Actions
    connect,
    disconnect,
    refreshRole,
    
    // Notifications
    notifications,
    addNotification,
    removeNotification,
    
    // Service instance
    service: blockchainService,
    
    // Helper methods
    formatAddress: (address) => {
      if (!address) return 'N/A';
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    },
    
    getRoleDisplayName: (role) => {
      switch (role) {
        case 'admin': return 'Administrator';
        case 'farmer': return 'Farmer';
        case 'lab_officer': return 'Lab Officer';
        case 'manufacturer': return 'Manufacturer';
        case 'consumer': return 'Consumer';
        default: return 'Unknown';
      }
    }
  };

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
};

export default BlockchainContext;