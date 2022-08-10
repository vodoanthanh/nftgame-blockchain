import { ethers } from "hardhat";
import deployRUNNOWUpgradeable from './deployRUNNOW';

const deployRUNNOWUpgradeableMain = async () => {
  await deployRUNNOWUpgradeable((await ethers.getSigners())[0]);
};

deployRUNNOWUpgradeableMain();
