import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { assert, expect } from 'chai';
import { BigNumber, Contract } from 'ethers';
import { ethers } from 'hardhat';
import { v4 as uuidv4 } from 'uuid';
import deployMarketplaceUpgradeable from '../../scripts/marketplace/deployMarketplace';
import deployNFTUpgradeable from '../../scripts/nft/deployNFT';
import upgradeNFTUpgradeable from '../../scripts/nft/upgradeNFT';
import { hashOrderItem } from '../../utils/hashMarketplaceItem';
import { createVoucher } from '../../utils/hashVoucher';
const provider = ethers.getDefaultProvider();

let deployer: SignerWithAddress;
let user: SignerWithAddress;
let buyer: SignerWithAddress;
let feesCollector: SignerWithAddress;
let NFTContract: Contract;
let MarketplaceContract: Contract;

describe('Marketplace', async () => {
    beforeEach(async () => {
        [deployer, user, buyer, feesCollector] = await ethers.getSigners();
        NFTContract = await deployNFTUpgradeable(deployer);
        MarketplaceContract = await deployMarketplaceUpgradeable(deployer);
    });

    describe('Offer', () => {
        it('returns right data', async () => {
            // Upgrade NFT Contract
            const NFTContractV2 = await upgradeNFTUpgradeable(NFTContract.address, deployer);

            // Premint
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
            const tx = await NFTContractV2.connect(user).redeem(signature1, {
                value: ethers.utils.parseEther('25')
            });
            await tx.wait();

            await NFTContractV2.connect(user).setApprovalForAll(
                MarketplaceContract.address,
                true
            );

            // Offer
            const nonce2 = uuidv4();
            const auth2 = {
                signer: deployer,
                contract: MarketplaceContract.address,
            };
            const types2 = {
                OrderItemStruct: [
                    { name: 'walletAddress', type: 'address' },
                    { name: 'id', type: 'string' },
                    { name: 'itemType', type: 'string' },
                    { name: 'extraType', type: 'string' },
                    { name: 'tokenId', type: 'uint256' },
                    { name: 'itemAddress', type: 'address' },
                    { name: 'price', type: 'uint256' },
                    { name: 'nonce', type: 'string' },
                ],
            };
            const orderItem2 = {
                walletAddress: user.address,
                id: '123',
                itemType: 'box',
                extraType: '',
                tokenId: BigNumber.from(1),
                itemAddress: NFTContract.address,
                price: ethers.utils.parseEther('100'),
                nonce: nonce2,
            };

            const signature2 = await hashOrderItem(types2, auth2, orderItem2);
            const tx2 = await MarketplaceContract.connect(user).offer(signature2);
            const receipt = await tx2.wait();
            const event = receipt.events?.filter((x: any) => {
                return x.event === 'OfferEvent';
            });

            expect(event[0].args.owner).to.equal(user.address);
            expect(event[0].args.id).to.equal(orderItem2.id);
        });
    });

    describe('Buy', () => {
        it('returns right data', async () => {
            // Upgrade NFT Contract
            const NFTContractV2 = await upgradeNFTUpgradeable(NFTContract.address, deployer);

            // Premint
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
            const tx = await NFTContractV2.connect(user).redeem(signature1, {
                value: ethers.utils.parseEther('25')
            });
            await tx.wait();

            await NFTContractV2.connect(user).setApprovalForAll(
                MarketplaceContract.address,
                true
            );

            // Offer
            const nonce2 = uuidv4();
            const auth2 = {
                signer: deployer,
                contract: MarketplaceContract.address,
            };
            const types2 = {
                OrderItemStruct: [
                    { name: 'walletAddress', type: 'address' },
                    { name: 'id', type: 'string' },
                    { name: 'itemType', type: 'string' },
                    { name: 'extraType', type: 'string' },
                    { name: 'tokenId', type: 'uint256' },
                    { name: 'itemAddress', type: 'address' },
                    { name: 'price', type: 'uint256' },
                    { name: 'nonce', type: 'string' },
                ],
            };
            const orderItem2 = {
                walletAddress: user.address,
                id: '123',
                itemType: 'box',
                extraType: '',
                tokenId: BigNumber.from(1),
                itemAddress: NFTContract.address,
                price: ethers.utils.parseEther('100'),
                nonce: nonce2,
            };

            const signature2 = await hashOrderItem(types2, auth2, orderItem2);
            const tx2 = await MarketplaceContract.connect(user).offer(signature2);
            await tx2.wait();

            const feesCollectorCutPerMillion = BigNumber.from(Math.ceil(5 / 100 * 1_000_000));
            await MarketplaceContract.connect(deployer).setFeesCollectorAddress(
                feesCollector.address
            );
            await MarketplaceContract.connect(deployer).setFeesCollectorCutPerMillion(
                feesCollectorCutPerMillion
            );

            const balanceOfFeesCollector1 = await provider.getBalance(feesCollector.address);

            // Buy
            const tx3 = await MarketplaceContract.connect(buyer).buy(orderItem2.id, {
                value: ethers.utils.parseEther('100')
            });
            const receipt = await tx3.wait();
            const event = receipt.events?.filter((x: any) => {
                return x.event === 'BuyEvent';
            });
            const balanceOfFeesCollector2 = await provider.getBalance(feesCollector.address);
            const diff = balanceOfFeesCollector2.sub(balanceOfFeesCollector1);

            assert(diff.lt(ethers.utils.parseEther('4.8')));
            expect(event[0].args.buyer).to.equal(buyer.address);
            expect(event[0].args.id).to.equal(orderItem2.id);
        });
    });

    describe('Withdraw', () => {
        context('when success', async () => {
            it('returns right data', async () => {
                // Upgrade NFT Contract
                const NFTContractV2 = await upgradeNFTUpgradeable(NFTContract.address, deployer);

                // Premint
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
                const tx = await NFTContractV2.connect(user).redeem(signature1, {
                    value: ethers.utils.parseEther('25')
                });
                await tx.wait();

                await NFTContractV2.connect(user).setApprovalForAll(
                    MarketplaceContract.address,
                    true
                );

                // Offer
                const nonce2 = uuidv4();
                const auth2 = {
                    signer: deployer,
                    contract: MarketplaceContract.address,
                };
                const types2 = {
                    OrderItemStruct: [
                        { name: 'walletAddress', type: 'address' },
                        { name: 'id', type: 'string' },
                        { name: 'itemType', type: 'string' },
                        { name: 'extraType', type: 'string' },
                        { name: 'tokenId', type: 'uint256' },
                        { name: 'itemAddress', type: 'address' },
                        { name: 'price', type: 'uint256' },
                        { name: 'nonce', type: 'string' },
                    ],
                };
                const orderItem2 = {
                    walletAddress: user.address,
                    id: '123',
                    itemType: 'box',
                    extraType: '',
                    tokenId: BigNumber.from(1),
                    itemAddress: NFTContract.address,
                    price: ethers.utils.parseEther('100'),
                    nonce: nonce2,
                };

                const signature2 = await hashOrderItem(types2, auth2, orderItem2);
                const tx2 = await MarketplaceContract.connect(user).offer(signature2);
                await tx2.wait();

                // Withdraw
                const tx3 = await MarketplaceContract.connect(user).withdraw(orderItem2.id);
                const receipt = await tx3.wait();
                const event = receipt.events?.filter((x: any) => {
                    return x.event === 'WithdrawEvent';
                });

                expect(event[0].args.owner).to.equal(user.address);
                expect(event[0].args.id).to.equal(orderItem2.id);
            });
        });
    });
});
