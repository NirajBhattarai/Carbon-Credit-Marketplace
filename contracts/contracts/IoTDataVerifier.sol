// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title IoTDataVerifier
 * @dev Contract for verifying IoT device data and managing thresholds
 * @author EcoTrade Team
 */
contract IoTDataVerifier is Ownable, Pausable, ReentrancyGuard {
    
    // Structs
    struct DataPoint {
        string deviceId;
        uint256 timestamp;
        uint256 co2Value;
        uint256 energyValue;
        uint256 temperature;
        uint256 humidity;
        string dataHash;
        bool verified;
    }
    
    struct DeviceThreshold {
        string deviceId;
        uint256 co2Threshold;
        uint256 energyThreshold;
        uint256 timeWindow; // in seconds
        bool isActive;
    }
    
    struct AccumulatedData {
        string deviceId;
        uint256 totalCo2;
        uint256 totalEnergy;
        uint256 dataPointCount;
        uint256 lastReset;
        bool thresholdReached;
    }
    
    // State variables
    mapping(string => DataPoint[]) public deviceDataPoints;
    mapping(string => DeviceThreshold) public deviceThresholds;
    mapping(string => AccumulatedData) public accumulatedData;
    mapping(string => bool) public registeredDevices;
    
    uint256 public constant MAX_DATA_POINTS_PER_DEVICE = 1000;
    uint256 public constant DEFAULT_TIME_WINDOW = 3600; // 1 hour
    
    // Events
    event DataPointAdded(string indexed deviceId, uint256 indexed timestamp, uint256 co2Value);
    event ThresholdReached(string indexed deviceId, uint256 co2Value, uint256 energyValue);
    event DeviceRegistered(string indexed deviceId, uint256 co2Threshold, uint256 energyThreshold);
    event ThresholdUpdated(string indexed deviceId, uint256 co2Threshold, uint256 energyThreshold);
    event DataVerified(string indexed deviceId, uint256 indexed timestamp, bool verified);
    
    // Modifiers
    modifier onlyRegisteredDevice(string memory _deviceId) {
        require(registeredDevices[_deviceId], "Device not registered");
        _;
    }
    
    modifier validDataPoint(
        string memory _deviceId,
        uint256 _co2Value,
        uint256 _energyValue,
        uint256 _temperature,
        uint256 _humidity
    ) {
        require(bytes(_deviceId).length > 0, "Device ID cannot be empty");
        require(_co2Value >= 0, "CO2 value must be non-negative");
        require(_energyValue >= 0, "Energy value must be non-negative");
        require(_temperature >= -50 && _temperature <= 100, "Temperature out of range");
        require(_humidity >= 0 && _humidity <= 100, "Humidity out of range");
        _;
    }
    
    constructor() {}
    
    /**
     * @dev Register a new IoT device
     * @param _deviceId Unique device identifier
     * @param _co2Threshold CO2 threshold for triggering actions
     * @param _energyThreshold Energy threshold for triggering actions
     */
    function registerDevice(
        string memory _deviceId,
        uint256 _co2Threshold,
        uint256 _energyThreshold
    ) external onlyOwner {
        require(bytes(_deviceId).length > 0, "Device ID cannot be empty");
        require(!registeredDevices[_deviceId], "Device already registered");
        require(_co2Threshold > 0, "CO2 threshold must be greater than 0");
        require(_energyThreshold > 0, "Energy threshold must be greater than 0");
        
        registeredDevices[_deviceId] = true;
        
        deviceThresholds[_deviceId] = DeviceThreshold({
            deviceId: _deviceId,
            co2Threshold: _co2Threshold,
            energyThreshold: _energyThreshold,
            timeWindow: DEFAULT_TIME_WINDOW,
            isActive: true
        });
        
        accumulatedData[_deviceId] = AccumulatedData({
            deviceId: _deviceId,
            totalCo2: 0,
            totalEnergy: 0,
            dataPointCount: 0,
            lastReset: block.timestamp,
            thresholdReached: false
        });
        
        emit DeviceRegistered(_deviceId, _co2Threshold, _energyThreshold);
    }
    
    /**
     * @dev Add a data point from an IoT device
     * @param _deviceId Device identifier
     * @param _co2Value CO2 measurement value
     * @param _energyValue Energy measurement value
     * @param _temperature Temperature reading
     * @param _humidity Humidity reading
     * @param _dataHash Hash of the raw data for verification
     */
    function addDataPoint(
        string memory _deviceId,
        uint256 _co2Value,
        uint256 _energyValue,
        uint256 _temperature,
        uint256 _humidity,
        string memory _dataHash
    ) external onlyRegisteredDevice(_deviceId) validDataPoint(_deviceId, _co2Value, _energyValue, _temperature, _humidity) {
        
        // Create new data point
        DataPoint memory newDataPoint = DataPoint({
            deviceId: _deviceId,
            timestamp: block.timestamp,
            co2Value: _co2Value,
            energyValue: _energyValue,
            temperature: _temperature,
            humidity: _humidity,
            dataHash: _dataHash,
            verified: false
        });
        
        // Add to device data points
        deviceDataPoints[_deviceId].push(newDataPoint);
        
        // Maintain max data points limit
        if (deviceDataPoints[_deviceId].length > MAX_DATA_POINTS_PER_DEVICE) {
            // Remove oldest data point
            for (uint256 i = 0; i < deviceDataPoints[_deviceId].length - 1; i++) {
                deviceDataPoints[_deviceId][i] = deviceDataPoints[_deviceId][i + 1];
            }
            deviceDataPoints[_deviceId].pop();
        }
        
        // Update accumulated data
        _updateAccumulatedData(_deviceId, _co2Value, _energyValue);
        
        emit DataPointAdded(_deviceId, block.timestamp, _co2Value);
    }
    
    /**
     * @dev Update accumulated data and check thresholds
     * @param _deviceId Device identifier
     * @param _co2Value CO2 measurement value
     * @param _energyValue Energy measurement value
     */
    function _updateAccumulatedData(string memory _deviceId, uint256 _co2Value, uint256 _energyValue) internal {
        AccumulatedData storage accData = accumulatedData[_deviceId];
        DeviceThreshold storage threshold = deviceThresholds[_deviceId];
        
        // Reset accumulated data if time window has passed
        if (block.timestamp - accData.lastReset > threshold.timeWindow) {
            accData.totalCo2 = 0;
            accData.totalEnergy = 0;
            accData.dataPointCount = 0;
            accData.lastReset = block.timestamp;
            accData.thresholdReached = false;
        }
        
        // Add new values
        accData.totalCo2 += _co2Value;
        accData.totalEnergy += _energyValue;
        accData.dataPointCount++;
        
        // Check if threshold is reached
        if (!accData.thresholdReached && 
            accData.totalCo2 >= threshold.co2Threshold && 
            accData.totalEnergy >= threshold.energyThreshold) {
            
            accData.thresholdReached = true;
            emit ThresholdReached(_deviceId, accData.totalCo2, accData.totalEnergy);
        }
    }
    
    /**
     * @dev Verify a data point
     * @param _deviceId Device identifier
     * @param _timestamp Timestamp of the data point
     * @param _verified Whether the data point is verified
     */
    function verifyDataPoint(
        string memory _deviceId,
        uint256 _timestamp,
        bool _verified
    ) external onlyOwner onlyRegisteredDevice(_deviceId) {
        
        DataPoint[] storage points = deviceDataPoints[_deviceId];
        
        for (uint256 i = 0; i < points.length; i++) {
            if (points[i].timestamp == _timestamp) {
                points[i].verified = _verified;
                emit DataVerified(_deviceId, _timestamp, _verified);
                break;
            }
        }
    }
    
    /**
     * @dev Update device thresholds
     * @param _deviceId Device identifier
     * @param _co2Threshold New CO2 threshold
     * @param _energyThreshold New energy threshold
     */
    function updateThresholds(
        string memory _deviceId,
        uint256 _co2Threshold,
        uint256 _energyThreshold
    ) external onlyOwner onlyRegisteredDevice(_deviceId) {
        require(_co2Threshold > 0, "CO2 threshold must be greater than 0");
        require(_energyThreshold > 0, "Energy threshold must be greater than 0");
        
        deviceThresholds[_deviceId].co2Threshold = _co2Threshold;
        deviceThresholds[_deviceId].energyThreshold = _energyThreshold;
        
        emit ThresholdUpdated(_deviceId, _co2Threshold, _energyThreshold);
    }
    
    /**
     * @dev Reset accumulated data for a device
     * @param _deviceId Device identifier
     */
    function resetAccumulatedData(string memory _deviceId) external onlyOwner onlyRegisteredDevice(_deviceId) {
        accumulatedData[_deviceId].totalCo2 = 0;
        accumulatedData[_deviceId].totalEnergy = 0;
        accumulatedData[_deviceId].dataPointCount = 0;
        accumulatedData[_deviceId].lastReset = block.timestamp;
        accumulatedData[_deviceId].thresholdReached = false;
    }
    
    /**
     * @dev Get latest data points for a device
     * @param _deviceId Device identifier
     * @param _count Number of latest points to return
     * @return Array of data points
     */
    function getLatestDataPoints(string memory _deviceId, uint256 _count) 
        external 
        view 
        onlyRegisteredDevice(_deviceId) 
        returns (DataPoint[] memory) 
    {
        DataPoint[] storage points = deviceDataPoints[_deviceId];
        uint256 length = points.length;
        
        if (_count > length) {
            _count = length;
        }
        
        DataPoint[] memory result = new DataPoint[](_count);
        uint256 startIndex = length - _count;
        
        for (uint256 i = 0; i < _count; i++) {
            result[i] = points[startIndex + i];
        }
        
        return result;
    }
    
    /**
     * @dev Get accumulated data for a device
     * @param _deviceId Device identifier
     * @return AccumulatedData struct
     */
    function getAccumulatedData(string memory _deviceId) 
        external 
        view 
        onlyRegisteredDevice(_deviceId) 
        returns (AccumulatedData memory) 
    {
        return accumulatedData[_deviceId];
    }
    
    /**
     * @dev Get device threshold information
     * @param _deviceId Device identifier
     * @return DeviceThreshold struct
     */
    function getDeviceThreshold(string memory _deviceId) 
        external 
        view 
        onlyRegisteredDevice(_deviceId) 
        returns (DeviceThreshold memory) 
    {
        return deviceThresholds[_deviceId];
    }
    
    /**
     * @dev Check if threshold is reached for a device
     * @param _deviceId Device identifier
     * @return bool True if threshold is reached
     */
    function isThresholdReached(string memory _deviceId) 
        external 
        view 
        onlyRegisteredDevice(_deviceId) 
        returns (bool) 
    {
        return accumulatedData[_deviceId].thresholdReached;
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
}
