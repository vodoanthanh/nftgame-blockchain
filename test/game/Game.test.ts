import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { assert, expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { ethers } from 'hardhat';
import { v4 as uuidv4 } from 'uuid';
import deployRUNGEMUpgradeable from '../../scripts/coin/deployRUNGEM';
import deployRUNNOWUpgradeable from '../../scripts/coin/deployRUNNOW';
import deployGameUpgradeable from '../../scripts/game/deployGame';
import deployNFTUpgradeable from '../../scripts/nft/deployNFT';
import upgradeNFTUpgradeable from '../../scripts/nft/upgradeNFT';
import { createVoucher } from '../../utils/hashVoucher';
const provider = ethers.getDefaultProvider();

let deployer: SignerWithAddress;
let user: SignerWithAddress;
let RUNNOWContract: Contract;
let RUNGEMContract: Contract;
let NFTContract: Contract;
let GameContract: Contract;

describe('Game', async () => {
    beforeEach(async () => {
        [deployer, user] = await ethers.getSigners();
        RUNNOWContract = await deployRUNNOWUpgradeable(deployer);
        RUNGEMContract = await deployRUNGEMUpgradeable(deployer);
        NFTContract = await deployNFTUpgradeable(deployer);
        GameContract = await deployGameUpgradeable(deployer);
    });

    describe('Withdraw token', () => {
        beforeEach(async () => {
            await RUNNOWContract.connect(deployer).transfer(
                GameContract.address,
                ethers.utils.parseEther('10000')
            );
        });

        it('returns right data - erc20 token', async () => {
            const nonce = uuidv4();
            const auth = {
                signer: deployer,
                contract: GameContract.address,
            };
            const type = {
                WithdrawTokenStruct: [
                    { name: 'walletAddress', type: 'address' },
                    { name: 'isNativeToken', type: 'bool' },
                    { name: 'tokenAddress', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                    { name: 'nonce', type: 'string' },
                ],
            };
            const voucher = {
                walletAddress: user.address,
                isNativeToken: false,
                tokenAddress: RUNNOWContract.address,
                amount: ethers.utils.parseEther('100'),
                nonce: nonce,
            };

            const signature = await createVoucher(type, auth, voucher);
            const balanceOfUserBefore = await RUNNOWContract.connect(user).balanceOf(
                user.address
            );
            expect(balanceOfUserBefore.toString()).to.equal('0');
            const tx = await GameContract.connect(user).withdrawToken(signature);
            await tx.wait();
            const balanceOfUserAfter = await RUNNOWContract.connect(user).balanceOf(
                user.address
            );
            expect(balanceOfUserAfter.toString()).to.equal(
                ethers.utils.parseEther('100').toString()
            );
        });

        it('returns right data - native token', async () => {
            const tx1 = await GameContract.connect(user).depositNativeToken(ethers.utils.parseEther('5'), {
                value: ethers.utils.parseEther('5')
            });
            await tx1.wait();

            const nonce = uuidv4();
            const auth = {
                signer: deployer,
                contract: GameContract.address,
            };
            const type = {
                WithdrawTokenStruct: [
                    { name: 'walletAddress', type: 'address' },
                    { name: 'isNativeToken', type: 'bool' },
                    { name: 'tokenAddress', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                    { name: 'nonce', type: 'string' },
                ],
            };
            const voucher = {
                walletAddress: user.address,
                isNativeToken: true,
                tokenAddress: RUNGEMContract.address,
                amount: ethers.utils.parseEther('5'),
                nonce: nonce,
            };

            const signature = await createVoucher(type, auth, voucher);
            const balanceOfUserBefore = await provider.getBalance(user.address);
            const tx = await GameContract.connect(user).withdrawToken(signature);
            await tx.wait();
            const balanceOfUserAfter = await provider.getBalance(user.address);
            const diff = balanceOfUserAfter.sub(balanceOfUserBefore);

            assert(diff.lt(ethers.utils.parseEther('4.8')));
        });
    });

    describe('Deposit token', () => {
        context('when deposit RUNNOW token', async () => {
            context('when success', async () => {
                beforeEach(async () => {
                    await RUNNOWContract.connect(deployer).transfer(
                        user.address,
                        ethers.utils.parseEther('1000')
                    );
                });

                it('updates right balance of user and balance of game', async () => {
                    let tx = await RUNNOWContract.connect(user).approve(
                        GameContract.address,
                        ethers.utils.parseEther('1000')
                    );
                    await tx.wait();

                    tx = await GameContract.connect(user).depositToken(
                        ethers.utils.parseEther('300'),
                        RUNNOWContract.address
                    );
                    await tx.wait();

                    const balanceOfUserAfter = await RUNNOWContract.connect(user).balanceOf(user.address);
                    const balanceOfGameAfter = await RUNNOWContract.connect(user).balanceOf(GameContract.address);

                    expect(balanceOfUserAfter.toString()).to.equal(ethers.utils.parseEther('700'));
                    expect(balanceOfGameAfter.toString()).to.equal(ethers.utils.parseEther('300'));
                });
            });

            context('when error', async () => {
                context('when user balance equal 0', async () => {
                    it('returns transfer amount exceeds balance', async () => {
                        let tx = await RUNNOWContract.connect(user).approve(
                            GameContract.address,
                            ethers.utils.parseEther('1000')
                        );
                        await tx.wait();

                        await expect(GameContract.connect(user).depositToken(
                            ethers.utils.parseEther('300'),
                            RUNNOWContract.address
                        )).to.be.revertedWith('ERC20: transfer amount exceeds balance');
                    });
                });

                context('when deposit amount equal 0', async () => {
                    beforeEach(async () => {
                        await RUNNOWContract.connect(deployer).transfer(
                            user.address,
                            ethers.utils.parseEther('1000')
                        );
                    });

                    it('returns amount must greater than zero', async () => {
                        let tx = await RUNNOWContract.connect(user).approve(
                            GameContract.address,
                            ethers.utils.parseEther('1000')
                        );
                        await tx.wait();

                        await expect(GameContract.connect(user).depositToken(
                            ethers.utils.parseEther('0'),
                            RUNNOWContract.address,
                        )).to.be.revertedWith('Amount must be greater than zero');
                    });
                });
            });
        });

        context('when deposite RUNGEM token', async () => {
            context('when success', async () => {
                beforeEach(async () => {
                    await RUNGEMContract.connect(deployer).transfer(
                        user.address,
                        ethers.utils.parseEther('1000')
                    );
                });

                it('updates right balance of user and balance of game', async () => {
                    let tx = await RUNGEMContract.connect(user).approve(
                        GameContract.address,
                        ethers.utils.parseEther('1000')
                    );
                    await tx.wait();

                    tx = await GameContract.connect(user).depositToken(
                        ethers.utils.parseEther('300'),
                        RUNGEMContract.address
                    );
                    await tx.wait();

                    const balanceOfUserAfter = await RUNGEMContract.connect(user).balanceOf(user.address);
                    const balanceOfGameAfter = await RUNGEMContract.connect(user).balanceOf(GameContract.address);

                    expect(balanceOfUserAfter.toString()).to.equal(ethers.utils.parseEther('700'));
                    expect(balanceOfGameAfter.toString()).to.equal(ethers.utils.parseEther('300'));
                });
            });

            context('when error', async () => {
                context('when user balance equal 0', async () => {
                    it('returns transfer amount exceeds balance', async () => {
                        let tx = await RUNGEMContract.connect(user).approve(
                            GameContract.address,
                            ethers.utils.parseEther('1000')
                        );
                        await tx.wait();

                        await expect(GameContract.connect(user).depositToken(
                            ethers.utils.parseEther('300'),
                            RUNGEMContract.address
                        )).to.be.revertedWith('ERC20: transfer amount exceeds balance');
                    });
                });

                context('when deposit amount equal 0', async () => {
                    beforeEach(async () => {
                        await RUNGEMContract.connect(deployer).transfer(
                            user.address,
                            ethers.utils.parseEther('1000')
                        );
                    });

                    it('returns amount must greater than zero', async () => {
                        let tx = await RUNGEMContract.connect(user).approve(
                            GameContract.address,
                            ethers.utils.parseEther('1000')
                        );
                        await tx.wait();

                        await expect(GameContract.connect(user).depositToken(
                            ethers.utils.parseEther('0'),
                            RUNGEMContract.address
                        )).to.be.revertedWith('Amount must be greater than zero');
                    });
                });
            });
        });

        context('when deposit NATIVE token', async () => {
            context('when success', async () => {
                it('updates right balance of user and balance of game', async () => {
                    const balanceOfUserBefore = await provider.getBalance(user.address);
                    let tx = await GameContract.connect(user).depositNativeToken(ethers.utils.parseEther('5'), {
                        value: ethers.utils.parseEther('5')
                    });
                    await tx.wait();
                    const balanceOfUserAfter = await provider.getBalance(user.address);
                    const diff = balanceOfUserBefore.sub(balanceOfUserAfter);

                    assert(diff.lt(ethers.utils.parseEther('4.8')));
                });
            });
        });
    });

    it('Deposit item', async () => {
        // Upgrade
        const NFTContractV2 = await upgradeNFTUpgradeable(NFTContract.address, deployer);

        await RUNNOWContract.connect(deployer).transfer(
            user.address,
            ethers.utils.parseEther('10000')
        );

        // Mint box
        await RUNNOWContract.connect(user).approve(
            NFTContractV2.address,
            ethers.utils.parseEther('25')
        );
        const nonce1 = uuidv4();
        const auth1 = {
            signer: deployer,
            contract: NFTContractV2.address,
        };
        const types1 = {
            ItemVoucherStruct: [
                { name: 'id', type: 'string' },
                { name: 'itemType', type: 'string' },
                { name: 'extraType', type: 'string' },
                { name: 'price', type: 'uint256' },
                { name: 'nonce', type: 'string' },
            ],
        };
        const voucher1 = {
            id: '123',
            itemType: 'box',
            extraType: '',
            price: ethers.utils.parseEther('25'),
            nonce: nonce1,
        };
        const signature1 = await createVoucher(types1, auth1, voucher1);
        const tx1 = await NFTContractV2.connect(user).redeem(signature1, {
            value: ethers.utils.parseEther('25')
        });
        await tx1.wait();

        // Approve NFT of user to game contract
        const tx3 = await NFTContractV2.connect(user).approve(
            GameContract.address,
            1
        );
        await tx3.wait();

        // Create depositNFT voucher
        const nonce2 = uuidv4();
        const auth2 = {
            signer: deployer,
            contract: GameContract.address,
        };
        const types2 = {
            DepositItemStruct: [
                { name: 'id', type: 'string' },
                { name: 'itemAddress', type: 'address' },
                { name: 'tokenId', type: 'uint256' },
                { name: 'itemType', type: 'string' },
                { name: 'extraType', type: 'string' },
                { name: 'nonce', type: 'string' },
            ],
        };

        const voucher2 = {
            id: '123',
            itemAddress: NFTContractV2.address,
            tokenId: 1,
            itemType: 'box',
            extraType: '',
            nonce: nonce2,
        };

        const signature2 = await createVoucher(types2, auth2, voucher2);

        // Send voucher (with signature) to game contract to deposit NFT
        await GameContract.connect(user).depositItem(signature2);

        const ownerTokenBefore = await NFTContractV2.ownerOf(1);
        expect(ownerTokenBefore).to.equal(GameContract.address);
    });

    it('Withdraw item', async () => {
        // Upgrade NFT Contract
        const NFTContractV2 = await upgradeNFTUpgradeable(NFTContract.address, deployer);

        await RUNNOWContract.connect(deployer).transfer(
            user.address,
            ethers.utils.parseEther('10000')
        );

        // Mint box
        await RUNNOWContract.connect(user).approve(
            NFTContractV2.address,
            ethers.utils.parseEther('25')
        );
        const nonce1 = uuidv4();
        const auth1 = {
            signer: deployer,
            contract: NFTContractV2.address,
        };
        const types1 = {
            ItemVoucherStruct: [
                { name: 'id', type: 'string' },
                { name: 'itemType', type: 'string' },
                { name: 'extraType', type: 'string' },
                { name: 'price', type: 'uint256' },
                { name: 'nonce', type: 'string' },
            ],
        };
        const voucher1 = {
            id: '123',
            itemType: 'box',
            extraType: '',
            price: ethers.utils.parseEther('25'),
            nonce: nonce1,
        };
        const signature1 = await createVoucher(types1, auth1, voucher1);
        const tx1 = await NFTContractV2.connect(user).redeem(signature1, {
            value: ethers.utils.parseEther('25')
        });
        await tx1.wait();

        const ownerTokenBefore = await NFTContractV2.ownerOf(1);
        expect(ownerTokenBefore).to.equal(user.address);

        // Approve NFT of user to game contract
        const tx3 = await NFTContractV2.connect(user).approve(
            GameContract.address,
            1
        );
        await tx3.wait();

        // Create depositNFT voucher
        const nonce2 = uuidv4();
        const auth2 = {
            signer: deployer,
            contract: GameContract.address,
        };
        const types2 = {
            DepositItemStruct: [
                { name: 'id', type: 'string' },
                { name: 'itemAddress', type: 'address' },
                { name: 'tokenId', type: 'uint256' },
                { name: 'itemType', type: 'string' },
                { name: 'extraType', type: 'string' },
                { name: 'nonce', type: 'string' },
            ],
        };

        const voucher2 = {
            id: '123',
            itemAddress: NFTContractV2.address,
            tokenId: 1,
            itemType: 'box',
            extraType: '',
            nonce: nonce2,
        };

        const signature2 = await createVoucher(types2, auth2, voucher2);

        // Send voucher (with signature) to game contract to deposit NFT
        await GameContract.connect(user).depositItem(signature2);

        // Create withdrawNFT voucher
        const nonce3 = uuidv4();
        const auth3 = {
            signer: deployer,
            contract: GameContract.address,
        };
        const types3 = {
            WithdrawItemStruct: [
                { name: 'walletAddress', type: 'address' },
                { name: 'id', type: 'string' },
                { name: 'itemAddress', type: 'address' },
                { name: 'tokenId', type: 'uint256' },
                { name: 'itemType', type: 'string' },
                { name: 'extraType', type: 'string' },
                { name: 'nonce', type: 'string' },
            ],
        };

        const voucher3 = {
            walletAddress: user.address,
            id: '123',
            itemAddress: NFTContractV2.address,
            tokenId: 1,
            itemType: 'box',
            extraType: '',
            nonce: nonce3,
        };

        const signature3 = await createVoucher(types3, auth3, voucher3);

        // Send voucher (with signature) to game contract to withdraw NFT
        const tx2 = await GameContract.connect(user).withdrawItem(signature3);
        await tx2.wait();

        const ownerToken = await NFTContractV2.ownerOf(1);
        expect(ownerToken).to.equal(user.address);
    });

    it('Crafting item', async () => {
        // Upgrade NFT Contract
        const NFTContractV2 = await upgradeNFTUpgradeable(NFTContract.address, deployer);

        await NFTContractV2.connect(deployer).setGameAddress(GameContract.address);

        // Create withdrawNFT voucher
        const nonce1 = uuidv4();
        const auth1 = {
            signer: deployer,
            contract: GameContract.address,
        };
        const types1 = {
            WithdrawItemStruct: [
                { name: 'walletAddress', type: 'address' },
                { name: 'id', type: 'string' },
                { name: 'itemAddress', type: 'address' },
                { name: 'tokenId', type: 'uint256' },
                { name: 'itemType', type: 'string' },
                { name: 'extraType', type: 'string' },
                { name: 'nonce', type: 'string' },
            ],
        };
        const voucher1 = {
            walletAddress: user.address,
            id: '123',
            itemAddress: NFTContractV2.address,
            tokenId: 0,
            itemType: 'box',
            extraType: '',
            nonce: nonce1,
        };

        const signature2 = await createVoucher(types1, auth1, voucher1);

        // Send voucher (with signature) to game contract to withdraw NFT
        const tx1 = await GameContract.connect(user).withdrawItem(signature2);
        const receipt1 = await tx1.wait();
        const event1 = receipt1.events?.filter((x: any) => {
            return x.event === 'WithdrawItemEvent';
        });
        expect(BigNumber.from(event1[0].args.tokenId).toNumber()).to.equal(1);

        const ownerToken = await NFTContractV2.ownerOf(1);
        expect(ownerToken).to.equal(user.address);
    });
});
