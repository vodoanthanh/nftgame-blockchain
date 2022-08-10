import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-truffle5';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-web3';
import "@openzeppelin/hardhat-upgrades";
import '@typechain/hardhat';
import * as dotenv from 'dotenv';
import 'hardhat-gas-reporter';
import { HardhatUserConfig } from 'hardhat/config';
import 'solidity-coverage';
import 'tsconfig-paths';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.2',
        settings: {
          optimizer: {
            enabled: true,
            runs: 150,
          },
        },
      },
    ],
  },
  networks: {
    bsc: {
      url: 'https://bsc-dataseed.binance.org',
      gas: 5000000,
      chainId: 56,
      accounts: {
        mnemonic: process.env.MNEMONIC_BSC_PROD,
      },
    },
    bscTestnet: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      gas: 5000000,
      chainId: 97,
      accounts: {
        mnemonic: process.env.MNEMONIC_BSC,
      },
    },
    avalanche: {
      url: 'https://api.avax.network/ext/bc/C/rpc',
      gas: 5000000,
      chainId: 43114,
      accounts: {
        mnemonic: process.env.MNEMONIC_AVAX_PROD,
      },
    },
    avalancheFujiTestnet: {
      url: 'https://api.avax-test.network/ext/bc/C/rpc',
      gas: 5000000,
      chainId: 43113,
      accounts: {
        mnemonic: process.env.MNEMONIC_AVAX,
      },
    },
  },
  etherscan: {
    apiKey: {
      bsc: process.env.BSC_API_KEY_PROD,
      bscTestnet: process.env.BSC_API_KEY,
      avalanche: process.env.SNOWTRACE_API_KEY_PROD,
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY
    }
  },
  gasReporter: {
    enabled: false,
    currency: 'USD',
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
  },
  mocha: {
    timeout: 50000,
  },
};

export default config;
