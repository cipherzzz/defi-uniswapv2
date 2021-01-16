const contract = artifacts.require("UniswapV2");
require('dotenv').config();

module.exports = function (deployer) {
  deployer.deploy(contract, process.env.UNISWAPV2_ROUTER_ADDRESS);
};
