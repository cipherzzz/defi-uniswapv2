pragma solidity ^0.7.0;

interface IUniswapV2 {
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);
    
    
    function swapTokensForExactTokens(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function WETH() external returns (address);
}

interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function approve(address spender, uint256 amount) external returns (bool);
}

contract UniswapV2 {
    IUniswapV2 uniswap;

    constructor(address _uniswap) {
        uniswap = IUniswapV2(_uniswap);
    }

    function swapExactETHForTokens(
        address token,
        uint256 amountOut,
        uint256 deadline
    ) external payable {
        address[] memory path = new address[](2);
        path[0] = uniswap.WETH();
        path[1] = token;

        uniswap.swapExactETHForTokens{value: msg.value}(amountOut, path, msg.sender, deadline);
    }
    
    function swapTokensForExactTokens(
        address tokenIn,
        uint256 amountInMax,
        address tokenOut,
        uint256 amountOut,
        uint256 deadline
    ) external payable {

        require(IERC20(tokenIn).transferFrom(msg.sender, address(this), amountInMax), 'transferFrom to contract failed.');
        require(IERC20(tokenIn).approve(address(uniswap), amountInMax), 'approve uniswap failed.');

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uniswap.swapTokensForExactTokens(amountOut, amountInMax, path, msg.sender, deadline);
    }
}
