import { ethers } from 'hardhat';
import deployNFTUpgradeable from './deployNFT';

const deployNFTUpgradeableMain = async () => {
    await deployNFTUpgradeable((await ethers.getSigners())[0]);
};

deployNFTUpgradeableMain();
