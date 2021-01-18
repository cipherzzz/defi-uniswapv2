const { legos } = require('@studydefi/money-legos');
  const { expect } = require('chai');
  const { Contract, ethers } = require('ethers');
  const { parseEther, formatUnits, parseUnits, BigNumber } = ethers.utils;

  require('dotenv').config();

  const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
  const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).connect(provider);
  const gasLimit = process.env.GAS_LIMIT;
  
  const artifact = require('../build/contracts/UniswapV2.json');
      const address = artifact.networks[process.env.NETWORK_ID].address;
      const abi = artifact.abi;
      let uniswap = new Contract(address, abi, wallet);
      
      export { wallet, uniswap, parseEther, formatUnits, parseUnits, BigNumber, Contract, ethers, expect, legos }