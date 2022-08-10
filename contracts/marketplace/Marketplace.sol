// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract MarketplaceUpgradeable is
    OwnableUpgradeable,
    EIP712Upgradeable,
    ReentrancyGuardUpgradeable
{
    using StringsUpgradeable for uint256;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    struct ItemStruct {
        string id;
        string itemType;
        string extraType;
        uint256 tokenId;
        address itemAddress;
        address owner;
        uint256 price;
        bool isExist;
    }

    struct OrderItemStruct {
        address walletAddress;
        string id;
        string itemType;
        string extraType;
        uint256 tokenId;
        address itemAddress;
        uint256 price;
        string nonce;
        bytes signature;
    }

    event OfferEvent(
        string id,
        string itemType,
        string extraType,
        uint256 tokenId,
        address owner,
        uint256 price,
        uint64 timestamp
    );

    event BuyEvent(
        string id,
        string itemType,
        string extraType,
        uint256 tokenId,
        address owner,
        uint256 price,
        address buyer,
        uint64 timestamp
    );

    event WithdrawEvent(
        string id,
        string itemType,
        string extraType,
        uint256 tokenId,
        address owner,
        uint64 timestamp
    );

    string public constant _SIGNING_DOMAIN = "Marketplace-Item";
    string private constant _SIGNATURE_VERSION = "1";

    address public feesCollectorAddress;
    uint256 public feesCollectorCutPerMillion;
    mapping(string => ItemStruct) public itemsMap;
    mapping(string => bool) private _noncesMap;

    function initialize() public virtual initializer {
        __Marketplace_init();
    }

    function __Marketplace_init() internal initializer {
        __EIP712_init(_SIGNING_DOMAIN, _SIGNATURE_VERSION);
        __ReentrancyGuard_init();
        __Ownable_init();
        __Marketplace_init_unchained();
    }

    function __Marketplace_init_unchained() internal initializer {
        feesCollectorAddress = _msgSender();
        feesCollectorCutPerMillion = 35_000; // 3.5%
    }

    function setFeesCollectorAddress(address data) external onlyOwner {
        feesCollectorAddress = data;
    }

    function setFeesCollectorCutPerMillion(uint256 data) external onlyOwner {
        feesCollectorCutPerMillion = data;
    }

    function offer(OrderItemStruct calldata data) public {
        // Make sure signature is valid and get the address of the signer
        address signer = _verifyOrderItem(data);
        // Make sure that the signer is authorized to offer item
        require(signer == owner(), "Signature invalid or unauthorized");

        // Check nonce
        require(!_noncesMap[data.nonce], "The nonce has been used");
        _noncesMap[data.nonce] = true;

        if (!itemsMap[data.id].isExist) {
            IERC721Upgradeable(data.itemAddress).transferFrom(
                _msgSender(),
                address(this),
                data.tokenId
            );
        }

        itemsMap[data.id] = ItemStruct({
            id: data.id,
            itemType: data.itemType,
            extraType: data.extraType,
            itemAddress: data.itemAddress,
            tokenId: data.tokenId,
            owner: _msgSender(),
            price: data.price,
            isExist: true
        });

        emit OfferEvent(
            data.id,
            data.itemType,
            data.extraType,
            data.tokenId,
            _msgSender(),
            data.price,
            uint64(block.timestamp)
        );
    }

    function _verifyOrderItem(OrderItemStruct calldata data)
        internal
        view
        returns (address)
    {
        bytes32 digest = _hashOrderItem(data);
        return ECDSAUpgradeable.recover(digest, data.signature);
    }

    function _hashOrderItem(OrderItemStruct calldata data)
        internal
        view
        returns (bytes32)
    {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        keccak256(
                            "OrderItemStruct(address walletAddress,string id,string itemType,string extraType,uint256 tokenId,address itemAddress,uint256 price,string nonce)"
                        ),
                        _msgSender(),
                        keccak256(bytes(data.id)),
                        keccak256(bytes(data.itemType)),
                        keccak256(bytes(data.extraType)),
                        data.tokenId,
                        data.itemAddress,
                        data.price,
                        keccak256(bytes(data.nonce))
                    )
                )
            );
    }

    function buy(string memory id) public payable nonReentrant {
        // Check exists & don't buy own
        require(itemsMap[id].isExist, "Item is not in marketplace");
        require(
            itemsMap[id].owner != _msgSender(),
            "You cannot buy your own item"
        );

        ItemStruct memory item = itemsMap[id];

        // Transfer payment
        require(msg.value >= item.price, "Not enough money");

        uint256 totalFeesShareAmount = (item.price *
            feesCollectorCutPerMillion) / 1_000_000;

        if (totalFeesShareAmount > 0) {
            (bool success, ) = feesCollectorAddress.call{value:totalFeesShareAmount}("");
            require(success, "Transfer fee failed");
        }

        uint256 ownerShareAmount = item.price - totalFeesShareAmount;
        (bool success, ) = item.owner.call{value: ownerShareAmount}("");
        require(success, "Transfer money failed");

        IERC721Upgradeable(item.itemAddress).transferFrom(
            address(this),
            _msgSender(),
            item.tokenId
        );

        emit BuyEvent(
            item.id,
            item.itemType,
            item.extraType,
            item.tokenId,
            item.owner,
            item.price,
            _msgSender(),
            uint64(block.timestamp)
        );

        delete itemsMap[id];
    }

    function withdraw(string memory id) public {
        require(itemsMap[id].owner == _msgSender(), "You don't own this item");

        ItemStruct memory item = itemsMap[id];

        IERC721Upgradeable(item.itemAddress).transferFrom(
            address(this),
            _msgSender(),
            item.tokenId
        );

        emit WithdrawEvent(
            item.id,
            item.itemType,
            item.extraType,
            item.tokenId,
            item.owner,
            uint64(block.timestamp)
        );

        delete itemsMap[id];
    }
}
