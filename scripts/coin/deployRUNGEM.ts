import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, upgrades } from 'hardhat';

const deployRUNGEMUpgradeable = async (deployer: SignerWithAddress) => {
  const upgradeableFactory = await ethers.getContractFactory('RUNGEMUpgradeable', deployer);
  const proxyInstance = await upgrades.deployProxy(upgradeableFactory);
  await proxyInstance.deployed();
  console.log('RUNGEM proxy\'s address: ', proxyInstance.address);

  return proxyInstance;
};

export default deployRUNGEMUpgradeable;
