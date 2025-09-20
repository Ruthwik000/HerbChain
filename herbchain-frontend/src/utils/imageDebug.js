import { getAllImageHashes, getImage } from '../services/imageService';

// Debug utility to check image storage
export const debugImageStorage = () => {
  const hashes = getAllImageHashes();
  console.log('🔍 Image Storage Debug:');
  console.log('  - Total stored images:', hashes.length);
  
  hashes.forEach((hash, index) => {
    const image = getImage(hash);
    console.log(`  - Image ${index + 1}:`);
    console.log(`    Hash: ${hash}`);
    console.log(`    Size: ${image ? `${Math.round(image.length / 1024)}KB` : 'Not found'}`);
    console.log(`    Type: ${image ? image.substring(0, 30) + '...' : 'N/A'}`);
  });
  
  return { hashes, count: hashes.length };
};

// Check if a specific hash exists
export const checkImageHash = (hash) => {
  const image = getImage(hash);
  console.log('🔍 Checking hash:', hash);
  console.log('  - Found:', !!image);
  if (image) {
    console.log('  - Size:', Math.round(image.length / 1024) + 'KB');
    console.log('  - Preview:', image.substring(0, 50) + '...');
  }
  return !!image;
};

// List all available hashes
export const listImageHashes = () => {
  const hashes = getAllImageHashes();
  console.log('📋 Available image hashes:');
  hashes.forEach((hash, index) => {
    console.log(`  ${index + 1}. ${hash}`);
  });
  return hashes;
};