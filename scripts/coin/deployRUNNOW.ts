import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat';

const deployRUNNOWUpgradeable = async (deployer: SignerWithAddress) => {
  const upgradeableFactory = await ethers.getContractFactory('RUNNOWUpgradeable', deployer);
  const proxyInstance = await upgrades.deployProxy(upgradeableFactory);
  await proxyInstance.deployed();
  console.log('RUNNOW proxy\'s address: ', proxyInstance.address);

  return proxyInstance;
};

export default deployRUNNOWUpgradeable;
