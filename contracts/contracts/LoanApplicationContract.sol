// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title LoanApplicationContract
/// @notice Stores immutable hashes of loan applications and their status updates
contract LoanApplicationContract {

    struct Application {
        bytes32 dataHash;
        uint256 submittedAt;
        address submittedBy;
        string  status;       // submitted | approved | rejected | modified
        uint256 updatedAt;
    }

    mapping(uint256 => Application) public applications;
    uint256[] public applicationIds;

    event ApplicationSubmitted(uint256 indexed appId, bytes32 dataHash, address by);
    event StatusUpdated(uint256 indexed appId, string oldStatus, string newStatus);

    modifier applicationExists(uint256 appId) {
        require(applications[appId].submittedAt != 0, "Application not found");
        _;
    }

    function submitApplication(uint256 appId, bytes32 dataHash) external {
        require(applications[appId].submittedAt == 0, "Already submitted");
        applications[appId] = Application({
            dataHash:    dataHash,
            submittedAt: block.timestamp,
            submittedBy: msg.sender,
            status:      "submitted",
            updatedAt:   block.timestamp
        });
        applicationIds.push(appId);
        emit ApplicationSubmitted(appId, dataHash, msg.sender);
    }

    function updateStatus(uint256 appId, string calldata newStatus)
        external applicationExists(appId)
    {
        string memory old = applications[appId].status;
        applications[appId].status    = newStatus;
        applications[appId].updatedAt = block.timestamp;
        emit StatusUpdated(appId, old, newStatus);
    }

    function getApplication(uint256 appId)
        external view
        returns (bytes32 dataHash, uint256 submittedAt, address submittedBy, string memory status)
    {
        Application storage a = applications[appId];
        return (a.dataHash, a.submittedAt, a.submittedBy, a.status);
    }

    function totalApplications() external view returns (uint256) {
        return applicationIds.length;
    }
}
