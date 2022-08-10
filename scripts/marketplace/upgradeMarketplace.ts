import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat';

const upgradeMarketplaceUpgradeable = async (baseAddress: string, deployer: SignerWithAddress, version: string = 'MarketplaceUpgradeableV2') => {
    const MarketplaceUpgradeableFactory = await ethers.getContractFactory(version, deployer);
    const MarketplaceUpgradeableInstance = await upgrades.upgradeProxy(baseAddress, MarketplaceUpgradeableFactory);
    console.log('MarketplaceUpgradeable upgraded');

    return MarketplaceUpgradeableInstance;
};

export default upgradeMarketplaceUpgradeable;
