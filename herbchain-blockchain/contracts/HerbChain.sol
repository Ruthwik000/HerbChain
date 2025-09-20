// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HerbChain
 * @dev Smart contract for herb traceability system with role-based access control
 */
contract HerbChain is AccessControl, ReentrancyGuard {

    // Role definitions
    bytes32 public constant FARMER_ROLE = keccak256("FARMER_ROLE");
    bytes32 public constant LAB_ROLE = keccak256("LAB_ROLE");
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");

    // Batch status enumeration
    enum BatchStatus { Pending, Approved, Rejected, Processed }

    // Batch data structure
    struct Batch {
        uint256 id;
        address farmer;
        string herbName;
        string location;
        uint256 moisturePercent;
        string photoIpfsHash;
        string notes;
        BatchStatus status;
        string rejectionReason;
        uint256 createdAt;
        uint256 approvedAt;
        uint256 processedAt;
        address labOfficer;
        address manufacturer;
        string qrCodeHash;
    }

    // State variables
    uint256 private _batchIdCounter;
    mapping(uint256 => Batch) public batches;
    mapping(string => uint256) public qrCodeToBatchId; // QR hash to batch ID mapping

    // Events
    event BatchCreated(uint256 indexed batchId, address indexed farmer, string herbName);
    event BatchApproved(uint256 indexed batchId, address indexed labOfficer, uint256 timestamp);
    event BatchRejected(uint256 indexed batchId, address indexed labOfficer, string reason, uint256 timestamp);
    event BatchProcessed(uint256 indexed batchId, address indexed manufacturer, string qrCodeHash, uint256 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // Modifiers
    modifier onlyFarmer() {
        require(hasRole(FARMER_ROLE, msg.sender), "HerbChain: caller is not a farmer");
        _;
    }

    modifier onlyLabOfficer() {
        require(hasRole(LAB_ROLE, msg.sender), "HerbChain: caller is not a lab officer");
        _;
    }

    modifier onlyManufacturer() {
        require(hasRole(MANUFACTURER_ROLE, msg.sender), "HerbChain: caller is not a manufacturer");
        _;
    }

    modifier batchExists(uint256 batchId) {
        require(batchId > 0 && batchId <= _batchIdCounter, "HerbChain: batch does not exist");
        _;
    }

    // Farmer Functions
    /**
     * @dev Creates a new batch with herb details
     * @param herbName Name of the herb
     * @param location Location where herb was grown
     * @param moisturePercent Moisture percentage of the herb
     * @param photoIpfsHash IPFS hash of the herb photo
     * @param notes Additional notes about the batch
     */
    function createBatch(
        string memory herbName,
        string memory location,
        uint256 moisturePercent,
        string memory photoIpfsHash,
        string memory notes
    ) external onlyFarmer nonReentrant returns (uint256) {
        require(bytes(herbName).length > 0, "HerbChain: herb name cannot be empty");
        require(bytes(location).length > 0, "HerbChain: location cannot be empty");
        require(moisturePercent <= 100, "HerbChain: moisture percent cannot exceed 100");
        require(bytes(photoIpfsHash).length > 0, "HerbChain: photo IPFS hash cannot be empty");

        _batchIdCounter++;
        uint256 newBatchId = _batchIdCounter;

        batches[newBatchId] = Batch({
            id: newBatchId,
            farmer: msg.sender,
            herbName: herbName,
            location: location,
            moisturePercent: moisturePercent,
            photoIpfsHash: photoIpfsHash,
            notes: notes,
            status: BatchStatus.Pending,
            rejectionReason: "",
            createdAt: block.timestamp,
            approvedAt: 0,
            processedAt: 0,
            labOfficer: address(0),
            manufacturer: address(0),
            qrCodeHash: ""
        });

        emit BatchCreated(newBatchId, msg.sender, herbName);
        return newBatchId;
    }

    // Lab Officer Functions
    /**
     * @dev Approves a pending batch
     * @param batchId ID of the batch to approve
     */
    function approveBatch(uint256 batchId) external onlyLabOfficer batchExists(batchId) nonReentrant {
        Batch storage batch = batches[batchId];
        require(batch.status == BatchStatus.Pending, "HerbChain: batch is not pending");

        batch.status = BatchStatus.Approved;
        batch.labOfficer = msg.sender;
        batch.approvedAt = block.timestamp;

        emit BatchApproved(batchId, msg.sender, block.timestamp);
    }

    /**
     * @dev Rejects a pending batch with a reason
     * @param batchId ID of the batch to reject
     * @param reason Reason for rejection
     */
    function rejectBatch(uint256 batchId, string memory reason) external onlyLabOfficer batchExists(batchId) nonReentrant {
        require(bytes(reason).length > 0, "HerbChain: rejection reason cannot be empty");
        
        Batch storage batch = batches[batchId];
        require(batch.status == BatchStatus.Pending, "HerbChain: batch is not pending");

        batch.status = BatchStatus.Rejected;
        batch.labOfficer = msg.sender;
        batch.rejectionReason = reason;

        emit BatchRejected(batchId, msg.sender, reason, block.timestamp);
    }

    // Manufacturer Functions
    /**
     * @dev Marks an approved batch as processed and stores QR code hash
     * @param batchId ID of the batch to process
     * @param qrCodeHash IPFS hash of the generated QR code
     */
    function processBatch(uint256 batchId, string memory qrCodeHash) external onlyManufacturer batchExists(batchId) nonReentrant {
        require(bytes(qrCodeHash).length > 0, "HerbChain: QR code hash cannot be empty");
        
        Batch storage batch = batches[batchId];
        require(batch.status == BatchStatus.Approved, "HerbChain: batch is not approved");

        batch.status = BatchStatus.Processed;
        batch.manufacturer = msg.sender;
        batch.processedAt = block.timestamp;
        batch.qrCodeHash = qrCodeHash;

        // Map QR code hash to batch ID for consumer lookup
        qrCodeToBatchId[qrCodeHash] = batchId;

        emit BatchProcessed(batchId, msg.sender, qrCodeHash, block.timestamp);
    }

    // Public/Consumer Functions
    /**
     * @dev Gets batch details by batch ID
     * @param batchId ID of the batch to retrieve
     * @return Batch struct with all details
     */
    function getBatch(uint256 batchId) external view batchExists(batchId) returns (Batch memory) {
        return batches[batchId];
    }

    /**
     * @dev Gets batch ID from QR code hash (for consumer scanning)
     * @param qrCodeHash IPFS hash of the QR code
     * @return batchId ID of the associated batch
     */
    function getBatchIdFromQR(string memory qrCodeHash) external view returns (uint256) {
        uint256 batchId = qrCodeToBatchId[qrCodeHash];
        require(batchId > 0, "HerbChain: QR code not found");
        return batchId;
    }

    /**
     * @dev Gets batch details by QR code hash
     * @param qrCodeHash IPFS hash of the QR code
     * @return Batch struct with all details
     */
    function getBatchByQR(string memory qrCodeHash) external view returns (Batch memory) {
        uint256 batchId = qrCodeToBatchId[qrCodeHash];
        require(batchId > 0, "HerbChain: QR code not found");
        return batches[batchId];
    }

    /**
     * @dev Gets all batches for a specific farmer
     * @param farmer Address of the farmer
     * @return batchIds Array of batch IDs owned by the farmer
     */
    function getFarmerBatches(address farmer) external view returns (uint256[] memory) {
        uint256 totalBatches = _batchIdCounter;
        uint256[] memory tempBatchIds = new uint256[](totalBatches);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalBatches; i++) {
            if (batches[i].farmer == farmer) {
                tempBatchIds[count] = i;
                count++;
            }
        }

        // Create array with exact size
        uint256[] memory farmerBatchIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            farmerBatchIds[i] = tempBatchIds[i];
        }

        return farmerBatchIds;
    }

    /**
     * @dev Gets all pending batches (for lab officers)
     * @return batchIds Array of pending batch IDs
     */
    function getPendingBatches() external view returns (uint256[] memory) {
        uint256 totalBatches = _batchIdCounter;
        uint256[] memory tempBatchIds = new uint256[](totalBatches);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalBatches; i++) {
            if (batches[i].status == BatchStatus.Pending) {
                tempBatchIds[count] = i;
                count++;
            }
        }

        uint256[] memory pendingBatchIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            pendingBatchIds[i] = tempBatchIds[i];
        }

        return pendingBatchIds;
    }

    /**
     * @dev Gets all approved batches (for manufacturers)
     * @return batchIds Array of approved batch IDs
     */
    function getApprovedBatches() external view returns (uint256[] memory) {
        uint256 totalBatches = _batchIdCounter;
        uint256[] memory tempBatchIds = new uint256[](totalBatches);
        uint256 count = 0;

        for (uint256 i = 1; i <= totalBatches; i++) {
            if (batches[i].status == BatchStatus.Approved) {
                tempBatchIds[count] = i;
                count++;
            }
        }

        uint256[] memory approvedBatchIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            approvedBatchIds[i] = tempBatchIds[i];
        }

        return approvedBatchIds;
    }

    /**
     * @dev Gets total number of batches created
     * @return Total batch count
     */
    function getTotalBatches() external view returns (uint256) {
        return _batchIdCounter;
    }

    // Admin Functions
    /**
     * @dev Grants farmer role to an address
     * @param farmer Address to grant farmer role
     */
    function grantFarmerRole(address farmer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(FARMER_ROLE, farmer);
    }

    /**
     * @dev Grants lab officer role to an address
     * @param labOfficer Address to grant lab officer role
     */
    function grantLabRole(address labOfficer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(LAB_ROLE, labOfficer);
    }

    /**
     * @dev Grants manufacturer role to an address
     * @param manufacturer Address to grant manufacturer role
     */
    function grantManufacturerRole(address manufacturer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MANUFACTURER_ROLE, manufacturer);
    }
}