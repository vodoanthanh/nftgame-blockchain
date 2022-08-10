import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat';

const upgradeNFTUpgradeable = async (baseAddress: string, deployer: SignerWithAddress, version: string = 'NFTUpgradeableV2') => {
    const NFTUpgradeableFactory = await ethers.getContractFactory(version, deployer);
    const NFTUpgradeableInstance = await upgrades.upgradeProxy(baseAddress, NFTUpgradeableFactory);
    console.log('NFTUpgradeable upgraded');

    return NFTUpgradeableInstance;
};

export default upgradeNFTUpgradeable;
