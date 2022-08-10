import { ethers } from 'hardhat';
import upgradeNFTUpgradeable from './upgradeNFT';

const upgradeNFTUpgradeableMain = async (baseAddress: string, version: string = 'NFTUpgradeableV2') => {
    await upgradeNFTUpgradeable(baseAddress, (await ethers.getSigners())[0], version);
};

upgradeNFTUpgradeableMain('0x8146a2Acd690961f5862a997DeeeCa9d0DaffD2c');
