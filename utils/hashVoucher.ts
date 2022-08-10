/* eslint-disable node/no-unsupported-features/es-syntax */
// eslint-disable-next-line node/no-unpublished-import
import hre from "hardhat";

const SIGNING_DOMAIN_NAME = "NFT-Voucher";
const SIGNING_DOMAIN_VERSION = "1";

export const createVoucher = async (types: any, auth: any, voucher: any) => {
  const domain = {
    name: SIGNING_DOMAIN_NAME,
    version: SIGNING_DOMAIN_VERSION,
    verifyingContract: auth.contract,
    chainId: hre.network.config.chainId,
  };
  const signature = await auth.signer._signTypedData(domain, types, voucher);

  return {
    ...voucher,
    signature,
  };
};
