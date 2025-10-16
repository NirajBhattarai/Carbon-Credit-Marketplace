// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CarbonCreditToken
 * @dev ERC20 token representing carbon credits with IoT device integration
 * @author EcoTrade Team
 */
contract CarbonCreditToken is ERC20, Ownable, Pausable, ReentrancyGuard {
    
    // Structs
    struct Device {
        address deviceAddress;
        string deviceId;
        DeviceType deviceType;
        bool isActive;
        uint256 lastActivity;
        uint256 totalCreditsGenerated;
        uint256 totalCreditsBurned;
        string location;
        string projectName;
    }
    
    struct MintRequest {
        address deviceAddress;
        string deviceId;
        uint256 amount;
        uint256 timestamp;
        string dataHash;
        bool processed;
    }
    
    struct BurnRequest {
        address deviceAddress;
        string deviceId;
        uint256 amount;
        uint256 timestamp;
        string dataHash;
        bool processed;
    }
    
    // Enums
    enum DeviceType { CREATOR, BURNER }
    
    // State variables
    mapping(address => Device) public devices;
    mapping(string => address) public deviceIdToAddress;
    mapping(uint256 => MintRequest) public mintRequests;
    mapping(uint256 => BurnRequest) public burnRequests;
    
    uint256 public mintRequestCounter;
    uint256 public burnRequestCounter;
    
    // Thresholds and rates
    uint256 public creatorThreshold = 1000; // 1000 CO2 reduction units = 1 credit
    uint256 public burnerThreshold = 1000;  // 1000 CO2 emission units = 1 credit burn
    uint256 public maxSupply = 1000000000 * 10**18; // 1 billion tokens
    
    // Events
    event DeviceRegistered(address indexed deviceAddress, string deviceId, DeviceType deviceType);
    event DeviceDeactivated(address indexed deviceAddress);
    event MintRequestCreated(uint256 indexed requestId, address indexed deviceAddress, uint256 amount);
    event MintRequestProcessed(uint256 indexed requestId, bool approved);
    event BurnRequestCreated(uint256 indexed requestId, address indexed deviceAddress, uint256 amount);
    event BurnRequestProcessed(uint256 indexed requestId, bool approved);
    event ThresholdsUpdated(uint256 creatorThreshold, uint256 burnerThreshold);
    
    // Modifiers
    modifier onlyRegisteredDevice() {
        require(devices[msg.sender].isActive, "Device not registered or inactive");
        _;
    }
    
    modifier onlyValidDeviceType(DeviceType _deviceType) {
        require(_deviceType == DeviceType.CREATOR || _deviceType == DeviceType.BURNER, "Invalid device type");
        _;
    }
    
    constructor() ERC20("Carbon Credit Token", "CCT") {
        // Initial supply can be minted by owner for initial distribution
    }
    
    /**
     * @dev Register a new IoT device
     * @param _deviceAddress Address of the device
     * @param _deviceId Unique device identifier
     * @param _deviceType Type of device (CREATOR or BURNER)
     * @param _location Geographic location of the device
     * @param _projectName Name of the carbon project
     */
    function registerDevice(
        address _deviceAddress,
        string memory _deviceId,
        DeviceType _deviceType,
        string memory _location,
        string memory _projectName
    ) external onlyOwner onlyValidDeviceType(_deviceType) {
        require(devices[_deviceAddress].deviceAddress == address(0), "Device already registered");
        require(deviceIdToAddress[_deviceId] == address(0), "Device ID already exists");
        
        devices[_deviceAddress] = Device({
            deviceAddress: _deviceAddress,
            deviceId: _deviceId,
            deviceType: _deviceType,
            isActive: true,
            lastActivity: block.timestamp,
            totalCreditsGenerated: 0,
            totalCreditsBurned: 0,
            location: _location,
            projectName: _projectName
        });
        
        deviceIdToAddress[_deviceId] = _deviceAddress;
        
        emit DeviceRegistered(_deviceAddress, _deviceId, _deviceType);
    }
    
    /**
     * @dev Deactivate a device
     * @param _deviceAddress Address of the device to deactivate
     */
    function deactivateDevice(address _deviceAddress) external onlyOwner {
        require(devices[_deviceAddress].isActive, "Device not active");
        
        devices[_deviceAddress].isActive = false;
        
        emit DeviceDeactivated(_deviceAddress);
    }
    
    /**
     * @dev Create a mint request for carbon credits
     * @param _amount Amount of credits to mint
     * @param _dataHash Hash of the IoT data for verification
     */
    function createMintRequest(uint256 _amount, string memory _dataHash) 
        external 
        onlyRegisteredDevice 
        whenNotPaused 
        nonReentrant 
    {
        require(devices[msg.sender].deviceType == DeviceType.CREATOR, "Only creator devices can mint");
        require(_amount > 0, "Amount must be greater than 0");
        require(totalSupply() + _amount <= maxSupply, "Would exceed max supply");
        
        uint256 requestId = mintRequestCounter++;
        
        mintRequests[requestId] = MintRequest({
            deviceAddress: msg.sender,
            deviceId: devices[msg.sender].deviceId,
            amount: _amount,
            timestamp: block.timestamp,
            dataHash: _dataHash,
            processed: false
        });
        
        devices[msg.sender].lastActivity = block.timestamp;
        
        emit MintRequestCreated(requestId, msg.sender, _amount);
    }
    
    /**
     * @dev Process a mint request (admin function)
     * @param _requestId ID of the mint request
     * @param _approved Whether to approve the request
     */
    function processMintRequest(uint256 _requestId, bool _approved) external onlyOwner {
        require(_requestId < mintRequestCounter, "Invalid request ID");
        require(!mintRequests[_requestId].processed, "Request already processed");
        
        MintRequest storage request = mintRequests[_requestId];
        request.processed = true;
        
        if (_approved) {
            _mint(request.deviceAddress, request.amount);
            devices[request.deviceAddress].totalCreditsGenerated += request.amount;
        }
        
        emit MintRequestProcessed(_requestId, _approved);
    }
    
    /**
     * @dev Create a burn request for carbon credits
     * @param _amount Amount of credits to burn
     * @param _dataHash Hash of the IoT data for verification
     */
    function createBurnRequest(uint256 _amount, string memory _dataHash) 
        external 
        onlyRegisteredDevice 
        whenNotPaused 
        nonReentrant 
    {
        require(devices[msg.sender].deviceType == DeviceType.BURNER, "Only burner devices can burn");
        require(_amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance to burn");
        
        uint256 requestId = burnRequestCounter++;
        
        burnRequests[requestId] = BurnRequest({
            deviceAddress: msg.sender,
            deviceId: devices[msg.sender].deviceId,
            amount: _amount,
            timestamp: block.timestamp,
            dataHash: _dataHash,
            processed: false
        });
        
        devices[msg.sender].lastActivity = block.timestamp;
        
        emit BurnRequestCreated(requestId, msg.sender, _amount);
    }
    
    /**
     * @dev Process a burn request (admin function)
     * @param _requestId ID of the burn request
     * @param _approved Whether to approve the request
     */
    function processBurnRequest(uint256 _requestId, bool _approved) external onlyOwner {
        require(_requestId < burnRequestCounter, "Invalid request ID");
        require(!burnRequests[_requestId].processed, "Request already processed");
        
        BurnRequest storage request = burnRequests[_requestId];
        request.processed = true;
        
        if (_approved) {
            _burn(request.deviceAddress, request.amount);
            devices[request.deviceAddress].totalCreditsBurned += request.amount;
        }
        
        emit BurnRequestProcessed(_requestId, _approved);
    }
    
    /**
     * @dev Update thresholds for minting and burning
     * @param _creatorThreshold New threshold for creator devices
     * @param _burnerThreshold New threshold for burner devices
     */
    function updateThresholds(uint256 _creatorThreshold, uint256 _burnerThreshold) external onlyOwner {
        require(_creatorThreshold > 0 && _burnerThreshold > 0, "Thresholds must be greater than 0");
        
        creatorThreshold = _creatorThreshold;
        burnerThreshold = _burnerThreshold;
        
        emit ThresholdsUpdated(_creatorThreshold, _burnerThreshold);
    }
    
    /**
     * @dev Emergency mint function for owner
     * @param _to Address to mint tokens to
     * @param _amount Amount to mint
     */
    function emergencyMint(address _to, uint256 _amount) external onlyOwner {
        require(totalSupply() + _amount <= maxSupply, "Would exceed max supply");
        _mint(_to, _amount);
    }
    
    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get device information
     * @param _deviceAddress Address of the device
     * @return Device information struct
     */
    function getDevice(address _deviceAddress) external view returns (Device memory) {
        return devices[_deviceAddress];
    }
    
    /**
     * @dev Get mint request information
     * @param _requestId ID of the mint request
     * @return MintRequest information struct
     */
    function getMintRequest(uint256 _requestId) external view returns (MintRequest memory) {
        return mintRequests[_requestId];
    }
    
    /**
     * @dev Get burn request information
     * @param _requestId ID of the burn request
     * @return BurnRequest information struct
     */
    function getBurnRequest(uint256 _requestId) external view returns (BurnRequest memory) {
        return burnRequests[_requestId];
    }
}
