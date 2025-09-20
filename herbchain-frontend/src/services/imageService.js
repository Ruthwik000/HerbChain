// Image storage service for demo purposes
// In a real implementation, this would use IPFS

const IMAGE_STORAGE_KEY = 'herbchain_images';

// Get all stored images
const getStoredImages = () => {
  try {
    const stored = localStorage.getItem(IMAGE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading stored images:', error);
    return {};
  }
};

// Save image data with IPFS hash as key
export const storeImage = (ipfsHash, imageDataUrl) => {
  try {
    const images = getStoredImages();
    images[ipfsHash] = imageDataUrl;
    localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
    console.log('📸 Image stored with hash:', ipfsHash);
    return true;
  } catch (error) {
    console.error('Error storing image:', error);
    return false;
  }
};

// Get image data by IPFS hash
export const getImage = (ipfsHash) => {
  try {
    const images = getStoredImages();
    return images[ipfsHash] || null;
  } catch (error) {
    console.error('Error retrieving image:', error);
    return null;
  }
};

// Get image from IPFS gateway (simplified for demo)
export const getImageFromIPFS = async (ipfsHash) => {
  if (!ipfsHash) return null;
  
  try {
    // First check local storage
    const localImage = getImage(ipfsHash);
    if (localImage) {
      console.log('📸 Image found in local storage');
      return localImage;
    }
    
    // For demo purposes, since the IPFS hash is not real, we'll just return null
    // In a real implementation, this would fetch from actual IPFS gateways
    console.log('🌐 IPFS hash detected but not a real IPFS hash:', ipfsHash);
    console.log('💡 In production, this would fetch from IPFS gateways');
    
    return null;
    
  } catch (error) {
    console.error('❌ Error in IPFS service:', error);
    return null;
  }
};

// Check if image exists
export const hasImage = (ipfsHash) => {
  const images = getStoredImages();
  return !!images[ipfsHash];
};

// Remove image
export const removeImage = (ipfsHash) => {
  try {
    const images = getStoredImages();
    delete images[ipfsHash];
    localStorage.setItem(IMAGE_STORAGE_KEY, JSON.stringify(images));
    return true;
  } catch (error) {
    console.error('Error removing image:', error);
    return false;
  }
};

// Get all image hashes
export const getAllImageHashes = () => {
  const images = getStoredImages();
  return Object.keys(images);
};

// Clear all images (for cleanup)
export const clearAllImages = () => {
  try {
    localStorage.removeItem(IMAGE_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing images:', error);
    return false;
  }
};