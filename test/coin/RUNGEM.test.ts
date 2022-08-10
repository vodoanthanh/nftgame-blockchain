import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import deployRUNGEMUpgradeable from '../../scripts/coin/deployRUNGEM';

let deployer: SignerWithAddress;
let user: SignerWithAddress;
let proxyInstance: Contract;

describe('RUNGEMUpgradeable', async () => {
    beforeEach(async () => {
        [deployer, user] = await ethers.getSigners();
        proxyInstance = await deployRUNGEMUpgradeable(deployer);
    });

    it('Deploy RUNGEM proxy', async () => {
        const deployerBalance = await proxyInstance
            .connect(deployer)
            .balanceOf(deployer.address);
        expect(deployerBalance.toString()).to.equal(
            ethers.utils.parseEther('1000000')
        );

        const userBalance = await proxyInstance
            .connect(user)
            .balanceOf(user.address);
        expect(userBalance.toString()).to.equal(ethers.utils.parseEther('0'));
    });

    it('Mint RUNGEM to account', async () => {
        const amount = ethers.utils.parseEther('1000');
        await proxyInstance.connect(deployer).mint(user.address, amount);

        const userBalance = await proxyInstance
            .connect(user)
            .balanceOf(user.address);
        expect(userBalance.toString()).to.equal(amount);
    });

    it('Burn RUNGEM error', async () => {
        try {
            const amount = ethers.utils.parseEther('1000000001');

            await proxyInstance.connect(deployer).setBurnAmount(amount);
            const newBurnAmount = await proxyInstance.connect(deployer).burnAmount();
            expect(newBurnAmount).equal(amount);

            await proxyInstance.connect(deployer).mintBurnToken(user.address);

            expect.fail();
        } catch (ex) {
            expect(JSON.stringify(ex)).include('RUNGEM: Exceed cap');
        }
    });
});
