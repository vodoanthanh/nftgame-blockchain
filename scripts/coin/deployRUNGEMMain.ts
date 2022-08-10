import { ethers } from 'hardhat';
import deployRUNGEMUpgradeable from './deployRUNGEM';

const deployRUNGEMUpgradeableMain = async () => {
  await deployRUNGEMUpgradeable((await ethers.getSigners())[0]);
};

deployRUNGEMUpgradeableMain();

