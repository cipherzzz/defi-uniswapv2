describe('UniswapV2', async function () {
  const { legos } = require('@studydefi/money-legos');
  const { expect } = require('chai');
  const { Contract, ethers, B } = require('ethers');
  const { parseEther, formatUnits, parseUnits, BigNumber } = ethers.utils;

  const {
    ChainId,
    Fetcher,
    WETH,
    Route,
    Trade,
    TokenAmount,
    TradeType,
    Percent,
  } = require('@uniswap/sdk');

  require('dotenv').config();

  const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
  const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC).connect(provider);
  const gasLimit = process.env.GAS_LIMIT;

  describe('Transactions', () => {
    let uniswap;

    beforeEach(async () => {
      const artifact = require('../build/contracts/UniswapV2.json');
      const address = artifact.networks[process.env.NETWORK_ID].address;
      const abi = artifact.abi;
      uniswap = new Contract(address, abi, wallet);
    });

    it('Should swap Eth for DAI within given slippage', async function () {
      const amountInEth = '.1';
      const percentageSlippage = '25';
      const slippageTolerance = new Percent(percentageSlippage, '100'); // 1 bip = 0.001 % - so 50 bips would be .05 %

      const dai = await Fetcher.fetchTokenData(ChainId.MAINNET, legos.erc20.dai.address);
      const weth = WETH[ChainId.MAINNET];
      const pair = await Fetcher.fetchPairData(dai, weth);
      const route = new Route([pair], weth);

      const trade = new Trade(
        route,
        new TokenAmount(weth, parseUnits(amountInEth), 18),
        TradeType.EXACT_INPUT
      );

      const midPrice = route.midPrice.toSignificant(6);
      const executionPrice = trade.executionPrice.toSignificant(6);
      const nextMidPrice = trade.nextMidPrice.toSignificant(6);

      // We expect to get more dai than eth in
      expect(Number(midPrice)).to.be.gt(Number(amountInEth));
      expect(Number(executionPrice)).to.be.gt(Number(amountInEth));
      expect(Number(nextMidPrice)).to.be.gt(Number(amountInEth));

      const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw.toString();

      // We expect the minimum trade amount to be greater than a 21% slippage
      expect(Number(formatUnits(amountOutMin, 18))).to.be.gt(
        (Number(midPrice) * Number(amountInEth) * (100 - Number(percentageSlippage))) / 100
      );

      const path = [weth.address, dai.address];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const value = trade.inputAmount.raw.toString();

      const tx = await uniswap.swapExactETHForTokens(
        legos.erc20.dai.address,
        amountOutMin,
        deadline,
        {
          value,
          gasLimit: process.env.GAS_LIMIT,
          gasPrice: 20e9,
        }
      );

      expect(tx).to.exist;

      const receipt = await tx.wait();
      expect(receipt.blockNumber).to.exist;
    });
  });
});
