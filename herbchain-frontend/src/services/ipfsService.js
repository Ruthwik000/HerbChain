import { create } from 'ipfs-http-client';
import blockchainService from './blockchainService';

class IPFSService {
  constructor() {
    // Initialize IPFS client (you can use Infura, Pinata, or local node)
    this.ipfs = create({
      host: process.env.REACT_APP_IPFS_HOST || 'ipfs.infura.io',
      port: process.env.REACT_APP_IPFS_PORT || 5001,
      protocol: process.env.REACT_APP_IPFS_PROTOCOL || 'https',
      headers: {
        authorization: process.env.REACT_APP_IPFS_AUTH || ''
      }
    });
    
    this.gateway = process.env.REACT_APP_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
  }

  // Upload file to IPFS
  async uploadFile(file, metadata = {}) {
    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided');
      }

      // Convert file to buffer
      const buffer = await this.fileToBuffer(file);
      
      // Upload to IPFS
      const result = await this.ipfs.add(buffer, {
        progress: (prog) => console.log(`Upload progress: ${prog}`)
      });

      const hash = result.cid.toString();
      
      // Store metadata on blockchain
      await blockchainService.uploadFileMetadata(
        hash,
        file.name,
        file.size,
        file.type
      );

      return {
        success: true,
        hash,
        url: this.getIPFSUrl(hash),
        size: file.size,
        type: file.type,
        name: file.name
      };
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload multiple files
  async uploadMultipleFiles(files) {
    try {
      const results = [];
      
      for (const file of files) {
        const result = await this.uploadFile(file);
        results.push(result);
      }
      
      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Upload JSON data
  async uploadJSON(data) {
    try {
      const jsonString = JSON.stringify(data);
      const buffer = Buffer.from(jsonString);
      
      const result = await this.ipfs.add(buffer);
      const hash = result.cid.toString();
      
      return {
        success: true,
        hash,
        url: this.getIPFSUrl(hash)
      };
    } catch (error) {
      console.error('Error uploading JSON to IPFS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get file from IPFS
  async getFile(hash) {
    try {
      const chunks = [];
      
      for await (const chunk of this.ipfs.cat(hash)) {
        chunks.push(chunk);
      }
      
      const data = Buffer.concat(chunks);
      
      return {
        success: true,
        data,
        url: this.getIPFSUrl(hash)
      };
    } catch (error) {
      console.error('Error getting file from IPFS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get JSON data from IPFS
  async getJSON(hash) {
    try {
      const result = await this.getFile(hash);
      
      if (result.success) {
        const jsonData = JSON.parse(result.data.toString());
        return {
          success: true,
          data: jsonData
        };
      }
      
      return result;
    } catch (error) {
      console.error('Error getting JSON from IPFS:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Pin file to ensure it stays available
  async pinFile(hash) {
    try {
      await this.ipfs.pin.add(hash);
      return { success: true };
    } catch (error) {
      console.error('Error pinning file:', error);
      return { success: false, error: error.message };
    }
  }

  // Unpin file
  async unpinFile(hash) {
    try {
      await this.ipfs.pin.rm(hash);
      return { success: true };
    } catch (error) {
      console.error('Error unpinning file:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate QR Code and upload to IPFS
  async uploadQRCode(batchId, qrCodeDataURL) {
    try {
      // Convert data URL to buffer
      const base64Data = qrCodeDataURL.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const result = await this.ipfs.add(buffer);
      const hash = result.cid.toString();
      
      // Store metadata
      await blockchainService.uploadFileMetadata(
        hash,
        `qr-${batchId}.png`,
        buffer.length,
        'image/png'
      );
      
      return {
        success: true,
        hash,
        url: this.getIPFSUrl(hash)
      };
    } catch (error) {
      console.error('Error uploading QR code:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper Methods
  fileToBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const buffer = Buffer.from(reader.result);
        resolve(buffer);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  getIPFSUrl(hash) {
    return `${this.gateway}${hash}`;
  }

  // Validate IPFS hash
  isValidHash(hash) {
    // Basic validation for IPFS hash
    return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(hash) || 
           /^bafy[a-z2-7]{55}$/.test(hash);
  }

  // Get file info from blockchain
  async getFileInfo(hash) {
    try {
      return await blockchainService.getFileInfo(hash);
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }

  // Check if file is active
  async isFileActive(hash) {
    try {
      const fileInfo = await this.getFileInfo(hash);
      return fileInfo ? fileInfo.isActive : false;
    } catch (error) {
      console.error('Error checking file status:', error);
      return false;
    }
  }
}

export default new IPFSService();