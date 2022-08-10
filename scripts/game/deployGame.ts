import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat';

const deployGameUpgradeable = async (deployer: SignerWithAddress) => {
    const upgradeableFactory = await ethers.getContractFactory('GameUpgradeable', deployer);
    const proxyInstance = await upgrades.deployProxy(upgradeableFactory);
    await proxyInstance.deployed();
    console.log('Game proxy\'s address: ', proxyInstance.address);

    return proxyInstance;
};
export default deployGameUpgradeable;
