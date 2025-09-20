// Mock users for authentication
const MOCK_USERS = {
  'farmer123': {
    role: 'Farmer',
    password: 'password123',
    name: 'John Doe',
    id: 'farmer123'
  },
  'lab123': {
    role: 'Lab',
    password: 'password123',
    name: 'Dr. Sarah Wilson',
    id: 'lab123'
  },
  'manufacturer123': {
    role: 'Manufacturer',
    password: 'password123',
    name: 'Mike Johnson',
    id: 'manufacturer123'
  }
};

// Authentication functions
export const authenticateUser = (username, password) => {
  const user = MOCK_USERS[username];
  if (user && user.password === password) {
    const userSession = {
      id: user.id,
      name: user.name,
      role: user.role,
      username,
      authMethod: 'traditional'
    };
    localStorage.setItem('herbchain_user', JSON.stringify(userSession));
    return userSession;
  }
  return null;
};

// MetaMask authentication
export const authenticateMetaMaskUser = (userData) => {
  const userSession = {
    id: userData.address,
    name: userData.address.substring(0, 6) + '...' + userData.address.substring(userData.address.length - 4),
    role: userData.role,
    username: userData.address,
    authMethod: 'metamask',
    address: userData.address,
    blockchainRole: userData.blockchainRole
  };
  localStorage.setItem('herbchain_user', JSON.stringify(userSession));
  return userSession;
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('herbchain_user');
  return userStr ? JSON.parse(userStr) : null;
};

export const logout = () => {
  localStorage.removeItem('herbchain_user');
};

// Batch data functions
export const saveBatches = (batches) => {
  localStorage.setItem('herbchain_batches', JSON.stringify(batches));
};

export const getBatches = () => {
  const batchesStr = localStorage.getItem('herbchain_batches');
  return batchesStr ? JSON.parse(batchesStr) : [];
};

// Consumer history functions
export const saveConsumerHistory = (history) => {
  localStorage.setItem('herbchain_consumer_history', JSON.stringify(history));
};

export const getConsumerHistory = () => {
  const historyStr = localStorage.getItem('herbchain_consumer_history');
  return historyStr ? JSON.parse(historyStr) : [];
};

export const addToConsumerHistory = (batchId) => {
  const history = getConsumerHistory();
  const existingIndex = history.findIndex(item => item.batchId === batchId);
  
  if (existingIndex >= 0) {
    history[existingIndex].lastViewed = new Date().toISOString();
  } else {
    history.unshift({
      batchId,
      lastViewed: new Date().toISOString()
    });
  }
  
  // Keep only last 50 items
  if (history.length > 50) {
    history.splice(50);
  }
  
  saveConsumerHistory(history);
};