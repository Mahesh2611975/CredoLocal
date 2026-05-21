// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title LoanApplicationContract
/// @notice Stores immutable hashes of loan applications and AI-based lending results
contract LoanApplicationContract {

    struct Application {
        // Core blockchain data
        bytes32 dataHash;

        uint256 submittedAt;
        address submittedBy;

        string status; // submitted | approved | rejected | modified

        uint256 updatedAt;

        // AI / ML outputs
        uint256 trustScore;
        uint256 safeLoanAmount;
        uint256 anomalyRisk;

        string riskCategory;
    }

    mapping(uint256 => Application) public applications;

    uint256[] public applicationIds;

    // Events
    event ApplicationSubmitted(
        uint256 indexed appId,
        bytes32 dataHash,
        address by
    );

    event StatusUpdated(
        uint256 indexed appId,
        string oldStatus,
        string newStatus
    );

    // Validation
    modifier applicationExists(uint256 appId) {
        require(
            applications[appId].submittedAt != 0,
            "Application not found"
        );
        _;
    }

    /// @notice Submit a new application with AI evaluation data
    function submitApplication(
        uint256 appId,
        bytes32 dataHash,

        uint256 trustScore,
        uint256 safeLoanAmount,
        uint256 anomalyRisk,

        string calldata riskCategory
    ) external {

        require(
            applications[appId].submittedAt == 0,
            "Already submitted"
        );

        applications[appId] = Application({
            dataHash: dataHash,

            submittedAt: block.timestamp,
            submittedBy: msg.sender,

            status: "submitted",

            updatedAt: block.timestamp,

            trustScore: trustScore,
            safeLoanAmount: safeLoanAmount,
            anomalyRisk: anomalyRisk,

            riskCategory: riskCategory
        });

        applicationIds.push(appId);

        emit ApplicationSubmitted(
            appId,
            dataHash,
            msg.sender
        );
    }

    /// @notice Update application status
    function updateStatus(
        uint256 appId,
        string calldata newStatus
    )
        external
        applicationExists(appId)
    {
        string memory old = applications[appId].status;

        applications[appId].status = newStatus;

        applications[appId].updatedAt = block.timestamp;

        emit StatusUpdated(
            appId,
            old,
            newStatus
        );
    }

    /// @notice Get full application details
    function getApplication(
        uint256 appId
    )
        external
        view
        returns (
            bytes32 dataHash,

            uint256 submittedAt,
            address submittedBy,

            string memory status,

            uint256 trustScore,
            uint256 safeLoanAmount,
            uint256 anomalyRisk,

            string memory riskCategory
        )
    {
        Application storage a = applications[appId];

        return (
            a.dataHash,

            a.submittedAt,
            a.submittedBy,

            a.status,

            a.trustScore,
            a.safeLoanAmount,
            a.anomalyRisk,

            a.riskCategory
        );
    }

    /// @notice Total applications stored
    function totalApplications()
        external
        view
        returns (uint256)
    {
        return applicationIds.length;
    }
}