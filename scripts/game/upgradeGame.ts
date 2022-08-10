import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat';

const upgradeGameUpgradeable = async (baseAddress: string, deployer: SignerWithAddress, version: string = 'GameUpgradeableV2') => {
    const GameUpgradeableFactory = await ethers.getContractFactory(version, deployer);
    const GameUpgradeableInstance = await upgrades.upgradeProxy(baseAddress, GameUpgradeableFactory);
    console.log('GameUpgradeable upgraded');

    return GameUpgradeableInstance;
};

export default upgradeGameUpgradeable;
