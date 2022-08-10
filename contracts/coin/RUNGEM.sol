// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract RUNGEMUpgradeable is
    Initializable,
    ERC20Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable
{
    uint256 public constant CAP = 1_000_000_000 * 10**18;
    address public constant BURN_ADDRESS =
        0x000000000000000000000000000000000000dEaD;
    uint256 public burnAmount;

    function initialize() public virtual initializer {
        __RUNGEM_init();
    }

    function __RUNGEM_init() internal initializer {
        __ERC20_init("RUNGEM", "RUNGEM");
        __Ownable_init();
        __Pausable_init();
        __RUNGEM_init_unchained();
    }

    function __RUNGEM_init_unchained() internal initializer {
        _mint(_msgSender(), 1_000_000 * 10**18);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function setBurnAmount(uint256 amount) external onlyOwner {
        burnAmount = amount;
    }

    function mintBurnToken(address to) external onlyOwner {
        require(totalSupply() + burnAmount <= CAP, "RUNGEM: Exceed cap"); // Address is zero
        _mint(to, burnAmount);
        burnAmount = 0;
    }
}
