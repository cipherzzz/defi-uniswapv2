import { expect, uniswap, legos, parseUnits, formatUnits, Contract, wallet  } from "./setup";

describe('UniswapV2', async function () {
  
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

  describe('Transactions', () => {

    beforeEach(async () => {
      
    });

    it('Should swap Eth for DAI within given slippage', async function () {
      const amountInEth = '.001';
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
    
    it('Should swap DAI for BAT within given slippage', async function () {
      const amountInDai = '1';
      const percentageSlippage = '25';
      const slippageTolerance = new Percent(percentageSlippage, '100'); // 1 bip = 0.001 % - so 50 bips would be .05 %

      const dai = await Fetcher.fetchTokenData(ChainId.MAINNET, legos.erc20.dai.address);
      const bat = await Fetcher.fetchTokenData(ChainId.MAINNET, legos.erc20.bat.address);
      const pair = await Fetcher.fetchPairData(dai, bat);
      const route = new Route([pair], dai);

      const trade = new Trade(
        route,
        new TokenAmount(dai, parseUnits(amountInDai), 18),
        TradeType.EXACT_INPUT
      );

      const midPrice = route.midPrice.toSignificant(6);
      const executionPrice = trade.executionPrice.toSignificant(6);
      const nextMidPrice = trade.nextMidPrice.toSignificant(6);

      // We expect to get more dai than eth in
      expect(Number(midPrice)).to.be.gt(Number(amountInDai));
      expect(Number(executionPrice)).to.be.gt(Number(amountInDai));
      expect(Number(nextMidPrice)).to.be.gt(Number(amountInDai));

      const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw.toString();

      // We expect the minimum trade amount to be greater than a percentageSlippage+1% slippage
      expect(Number(formatUnits(amountOutMin, 18))).to.be.gt(
        (Number(midPrice) * Number(amountInDai) * (100 - Number(percentageSlippage))) / 100
      );

      const path = [dai.address, bat.address];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
      const value = trade.inputAmount.raw.toString();

      const daiContract = new Contract(legos.erc20.dai.address, legos.erc20.dai.abi, wallet);
      const daiBalanceBefore = await daiContract.balanceOf(wallet.address);
      
      const batContract = new Contract(legos.erc20.bat.address, legos.erc20.bat.abi, wallet);
      const batBalanceBefore = await batContract.balanceOf(wallet.address);
      
      await daiContract.approve(uniswap.address, value);

      const tx = await uniswap.swapTokensForExactTokens(
        legos.erc20.dai.address,
        value,
        legos.erc20.bat.address,
        amountOutMin,
        deadline,
        {
          gasLimit: process.env.GAS_LIMIT,
          gasPrice: 20e9,
        }
      );

      expect(tx).to.exist;

      const receipt = await tx.wait();
      expect(receipt.blockNumber).to.exist;
      
      const daiBalanceAfter = await daiContract.balanceOf(wallet.address);
      const batBalanceAfter = await batContract.balanceOf(wallet.address);

      expect(Number(formatUnits(daiBalanceAfter, 18))).to.eq(Number(formatUnits(daiBalanceBefore, 18)) - 1);
      expect(Number(formatUnits(batBalanceAfter, 18))).to.eq(Number(formatUnits(batBalanceBefore.add(amountOutMin), 18)));

    });
  });
  });
