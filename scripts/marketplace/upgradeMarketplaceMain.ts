import { ethers } from 'hardhat';
import upgradeMarketplaceUpgradeable from './upgradeMarketplace';

const upgradeMarketplaceUpgradeableMain = async (baseAddress: string, version: string = 'MarketplaceUpgradeable') => {
    await upgradeMarketplaceUpgradeable(baseAddress, (await ethers.getSigners())[0], version);
};

upgradeMarketplaceUpgradeableMain('0xc8300990291c772F264A7554e657E58d5a82e9B7');
