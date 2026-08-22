// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract LandRegistry {
    struct Land {
        uint256 id;
        string  surveyNumber;
        string  village;
        string  taluka;
        string  district;
        address owner;
        string  area;
        bool    registered;
    }

    struct TransactionRecord {
        uint256 landId;
        address from;
        address to;
        string  areaSold;
        uint256 timestamp;
    }

    mapping(uint256 => Land) public lands;
    TransactionRecord[] public transactions;
    uint256 public landCount = 0;

    event LandRegistered(uint256 landId, address owner);
    event OwnershipTransferred(uint256 landId, address from, address to, string areaSold);
    event PartialTransfer(uint256 originalLandId, uint256 newLandId, address from, address to, string areaSold);

    function registerLand(
        string memory _surveyNumber,
        string memory _village,
        string memory _taluka,
        string memory _district,
        string memory _area
    ) public returns (uint256) {
        landCount++;
        lands[landCount] = Land(
            landCount, _surveyNumber, _village,
            _taluka, _district, msg.sender, _area, true
        );
        emit LandRegistered(landCount, msg.sender);
        return landCount;
    }

    function transferOwnership(uint256 _landId, address _newOwner, string memory _areaSold) public {
        require(lands[_landId].registered, "Land not registered");
        require(lands[_landId].owner == msg.sender, "Not the owner");
        address prev = lands[_landId].owner;
        lands[_landId].owner = _newOwner;
        lands[_landId].area  = _areaSold;
        transactions.push(TransactionRecord(_landId, prev, _newOwner, _areaSold, block.timestamp));
        emit OwnershipTransferred(_landId, prev, _newOwner, _areaSold);
    }

    function partialTransfer(
        uint256 _landId,
        address _newOwner,
        string memory _soldArea,
        string memory _remainingArea
    ) public returns (uint256) {
        require(lands[_landId].registered, "Land not registered");
        require(lands[_landId].owner == msg.sender, "Not the owner");

        // Update original land with remaining area
        lands[_landId].area = _remainingArea;

        // Create new land entry for buyer
        landCount++;
        lands[landCount] = Land(
            landCount,
            lands[_landId].surveyNumber,
            lands[_landId].village,
            lands[_landId].taluka,
            lands[_landId].district,
            _newOwner,
            _soldArea,
            true
        );

        transactions.push(TransactionRecord(
            _landId, msg.sender, _newOwner, _soldArea, block.timestamp
        ));
        emit PartialTransfer(_landId, landCount, msg.sender, _newOwner, _soldArea);
        return landCount;
    }

    function getLand(uint256 _landId) public view returns (
        uint256, string memory, string memory, string memory,
        string memory, address, string memory, bool
    ) {
        Land memory l = lands[_landId];
        return (l.id, l.surveyNumber, l.village, l.taluka,
                l.district, l.owner, l.area, l.registered);
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }
}