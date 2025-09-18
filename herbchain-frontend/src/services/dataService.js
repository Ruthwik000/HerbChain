import { getBatches, saveBatches } from './localStorageService';

// Mock delay for async operations
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Generate batch ID
const generateBatchId = (herb) => {
  const prefix = herb.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${year}-${random}`;
};

// Initial mock data
const initializeMockData = () => {
  const existingBatches = getBatches();
  if (existingBatches.length === 0) {
    const mockBatches = [
      {
        id: 'ASH-2025-001',
        herb: 'Ashwagandha',
        farmer: 'John Doe',
        farmerId: 'farmer123',
        location: 'Rajasthan, India',
        coordinates: { lat: 27.0238, lng: 74.2179 },
        moisture: 8.5,
        harvestDate: '2025-09-15',
        photoUrl: 'https://images.unsplash.com/photo-1544991875-5dc1b05f607d?w=400',
        notes: 'Organic cultivation, sun-dried',
        status: 'Pending',
        createdAt: '2025-09-15T10:00:00Z',
        timeline: [
          {
            stage: 'Created',
            status: 'Completed',
            date: '2025-09-15T10:00:00Z',
            actor: 'John Doe (Farmer)',
            notes: 'Batch created and submitted for review'
          }
        ]
      },
      {
        id: 'TUL-2025-002',
        herb: 'Tulsi',
        farmer: 'John Doe',
        farmerId: 'farmer123',
        location: 'Kerala, India',
        coordinates: { lat: 10.8505, lng: 76.2711 },
        moisture: 7.2,
        harvestDate: '2025-09-10',
        photoUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        notes: 'Fresh harvest, properly dried',
        status: 'Approved',
        createdAt: '2025-09-10T08:00:00Z',
        approvedAt: '2025-09-12T14:30:00Z',
        timeline: [
          {
            stage: 'Created',
            status: 'Completed',
            date: '2025-09-10T08:00:00Z',
            actor: 'John Doe (Farmer)',
            notes: 'Batch created and submitted for review'
          },
          {
            stage: 'Lab Review',
            status: 'Completed',
            date: '2025-09-12T14:30:00Z',
            actor: 'Dr. Sarah Wilson (Lab)',
            notes: 'Quality tests passed. Moisture content optimal.'
          }
        ]
      },
      {
        id: 'TUR-2025-003',
        herb: 'Turmeric',
        farmer: 'John Doe',
        farmerId: 'farmer123',
        location: 'Tamil Nadu, India',
        coordinates: { lat: 11.1271, lng: 78.6569 },
        moisture: 9.1,
        harvestDate: '2025-09-05',
        photoUrl: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400',
        notes: 'Premium quality turmeric, organic certified',
        status: 'Processed',
        createdAt: '2025-09-05T09:00:00Z',
        approvedAt: '2025-09-07T11:15:00Z',
        processedAt: '2025-09-14T16:45:00Z',
        processingNotes: 'Processed by Mike Johnson on 9/14/2025. Ground to fine powder, packaged in sealed containers.',
        timeline: [
          {
            stage: 'Created',
            status: 'Completed',
            date: '2025-09-05T09:00:00Z',
            actor: 'John Doe (Farmer)',
            notes: 'Batch created and submitted for review'
          },
          {
            stage: 'Lab Review',
            status: 'Completed',
            date: '2025-09-07T11:15:00Z',
            actor: 'Dr. Sarah Wilson (Lab)',
            notes: 'Excellent quality. All parameters within acceptable range.'
          },
          {
            stage: 'Manufacturing',
            status: 'Completed',
            date: '2025-09-14T16:45:00Z',
            actor: 'Mike Johnson (Manufacturer)',
            notes: 'Processed by Mike Johnson on 9/14/2025. Ground to fine powder, packaged in sealed containers.'
          }
        ]
      }
    ];
    saveBatches(mockBatches);
  }
};

// Initialize mock data on service load
initializeMockData();

export const createBatch = async (batchData) => {
  await delay();
  
  const batches = getBatches();
  const newBatch = {
    id: generateBatchId(batchData.herb),
    ...batchData,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    timeline: [
      {
        stage: 'Created',
        status: 'Completed',
        date: new Date().toISOString(),
        actor: `${batchData.farmer} (Farmer)`,
        notes: 'Batch created and submitted for review'
      }
    ]
  };
  
  batches.push(newBatch);
  saveBatches(batches);
  
  return newBatch;
};

export const getBatchesByRole = async (role, userId) => {
  await delay(200);
  
  const batches = getBatches();
  
  switch (role) {
    case 'Farmer':
      return batches.filter(batch => batch.farmerId === userId);
    case 'Lab':
      return batches; // Lab can see all batches
    case 'Manufacturer':
      return batches.filter(batch => batch.status === 'Approved' || batch.status === 'Processed');
    default:
      return batches;
  }
};

export const getBatchById = async (batchId) => {
  await delay(200);
  
  const batches = getBatches();
  return batches.find(batch => batch.id === batchId);
};

export const approveBatch = async (batchId, labOfficer) => {
  await delay();
  
  const batches = getBatches();
  const batchIndex = batches.findIndex(batch => batch.id === batchId);
  
  if (batchIndex >= 0) {
    batches[batchIndex].status = 'Approved';
    batches[batchIndex].approvedAt = new Date().toISOString();
    batches[batchIndex].timeline.push({
      stage: 'Lab Review',
      status: 'Completed',
      date: new Date().toISOString(),
      actor: `${labOfficer} (Lab)`,
      notes: 'Quality tests passed. Batch approved for manufacturing.'
    });
    
    saveBatches(batches);
    return batches[batchIndex];
  }
  
  throw new Error('Batch not found');
};

export const rejectBatch = async (batchId, reason, labOfficer) => {
  await delay();
  
  const batches = getBatches();
  const batchIndex = batches.findIndex(batch => batch.id === batchId);
  
  if (batchIndex >= 0) {
    batches[batchIndex].status = 'Rejected';
    batches[batchIndex].rejectedAt = new Date().toISOString();
    batches[batchIndex].rejectionReason = reason;
    batches[batchIndex].timeline.push({
      stage: 'Lab Review',
      status: 'Rejected',
      date: new Date().toISOString(),
      actor: `${labOfficer} (Lab)`,
      notes: `Batch rejected: ${reason}`
    });
    
    saveBatches(batches);
    return batches[batchIndex];
  }
  
  throw new Error('Batch not found');
};

export const markAsProcessed = async (batchId, processingNotes, manufacturer) => {
  await delay();
  
  const batches = getBatches();
  const batchIndex = batches.findIndex(batch => batch.id === batchId);
  
  if (batchIndex >= 0) {
    batches[batchIndex].status = 'Processed';
    batches[batchIndex].processedAt = new Date().toISOString();
    batches[batchIndex].processingNotes = processingNotes;
    batches[batchIndex].timeline.push({
      stage: 'Manufacturing',
      status: 'Completed',
      date: new Date().toISOString(),
      actor: `${manufacturer} (Manufacturer)`,
      notes: processingNotes || 'Batch processed and packaged successfully.'
    });
    
    saveBatches(batches);
    return batches[batchIndex];
  }
  
  throw new Error('Batch not found');
};

export const getBatchStats = async (farmerId) => {
  await delay(200);
  
  const batches = getBatches().filter(batch => batch.farmerId === farmerId);
  
  return {
    total: batches.length,
    pending: batches.filter(b => b.status === 'Pending').length,
    approved: batches.filter(b => b.status === 'Approved' || b.status === 'Processed').length,
    rejected: batches.filter(b => b.status === 'Rejected').length,
    processed: batches.filter(b => b.status === 'Processed').length
  };
};