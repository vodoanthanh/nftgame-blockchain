import { ethers } from 'hardhat';
import upgradeGameUpgradeable from './upgradeGame';

const upgradeGameUpgradeableMain = async (baseAddress: string, version: string = 'GameUpgradeable') => {
    await upgradeGameUpgradeable(baseAddress, (await ethers.getSigners())[0], version);
};

upgradeGameUpgradeableMain('0xcfB1BE6e38daD77a3dCd682CD6E277b407Fc29ce');
