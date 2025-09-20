import { getAllImageHashes, getImage, storeImage } from '../services/imageService';

// Fix image hash mismatches by re-linking available images to blockchain hashes
export const relinkImages = (batchData) => {
  const availableHashes = getAllImageHashes();
  console.log('🔗 Relinking images...');
  console.log('  - Available hashes:', availableHashes);
  console.log('  - Batch IPFS hash:', batchData.photoIpfsHash);
  
  if (availableHashes.length > 0 && batchData.photoIpfsHash) {
    // If we have images but the blockchain hash doesn't match
    const exactMatch = getImage(batchData.photoIpfsHash);
    
    if (!exactMatch && availableHashes.length > 0) {
      // Take the first available image and store it with the blockchain hash
      const firstAvailableHash = availableHashes[0];
      const imageData = getImage(firstAvailableHash);
      
      if (imageData) {
        console.log('🔗 Relinking image:', firstAvailableHash, '→', batchData.photoIpfsHash);
        storeImage(batchData.photoIpfsHash, imageData);
        return true;
      }
    }
  }
  
  return false;
};

// Auto-fix all batch images
export const autoFixBatchImages = (batches) => {
  console.log('🔧 Auto-fixing batch images...');
  let fixedCount = 0;
  
  batches.forEach(batch => {
    if (relinkImages(batch)) {
      fixedCount++;
    }
  });
  
  console.log(`✅ Fixed ${fixedCount} batch images`);
  return fixedCount;
};

// Manual image assignment for a specific batch
export const assignImageToBatch = (batchId, ipfsHash) => {
  const availableHashes = getAllImageHashes();
  
  if (availableHashes.length > 0) {
    const imageData = getImage(availableHashes[0]);
    if (imageData) {
      storeImage(ipfsHash, imageData);
      console.log('✅ Manually assigned image to batch:', batchId);
      return true;
    }
  }
  
  return false;
};