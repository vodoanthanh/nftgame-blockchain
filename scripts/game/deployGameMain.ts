import { ethers } from 'hardhat';
import deployGameUpgradeable from './deployGame';

const deployGameUpgradeableMain = async () => {
    await deployGameUpgradeable((await ethers.getSigners())[0]);
};

deployGameUpgradeableMain();
