import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat';

const deployNFTUpgradeable = async (deployer: SignerWithAddress) => {
    const upgradeableFactory = await ethers.getContractFactory('NFTUpgradeable', deployer);
    const proxyInstance = await upgrades.deployProxy(upgradeableFactory);
    await proxyInstance.deployed();
    console.log('NFT proxy\'s address: ', proxyInstance.address);

    return proxyInstance;
};

export default deployNFTUpgradeable;
