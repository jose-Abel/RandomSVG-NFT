let { networkConfig } = require("../helper-hardhat-config");

module.exports = async({
    getNamedAccounts,
    deployments,
    getChainId
}) => {
    const { deploy, get, log } = deployments;

    const { deployer } = await getNamedAccounts();

    const chainId = await getChainId();

    let linkTokenAddress, vrfCoordinatorAddress

    if(chainId == 31337) {
        let linkToken = await get("LinkToken");

        linkTokenAddress = linkToken.address;

        let vrfCoordinatorMock = await get("VRFCoordinatorMock");

        vrfCoordinatorAddress = vrfCoordinatorMock.address;
    }

    else {
        linkTokenAddress = networkConfig[chainId]["LinkToken"];

        vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinator"];
    }

    const keyHash = networkConfig[chainId]["keyHash"];

    const fee = networkConfig[chainId]["fee"];

    let args = [vrfCoordinatorAddress, linkTokenAddress, keyHash, fee];

    log("-------------------------------");

    const RandomSVG = await deploy("RandomSVG", {
        from: deployer,
        args: args,
        log: true
    });

    log("You have deployed your NFT contract!");

    const networkName = networkConfig[chainId]["name"];

    log(`Verify with:\n npx hardhat verify --network ${networkName} ${RandomSVG.address} ${args.toString().replace(/,/g, " ")}`);

    // Fund with LINK

    const linkTokenContract = await ethers.getContractFactory("LinkToken");

    const accounts = await hre.ethers.getSigners();

    const signer = accounts[0];

    const linkToken = new ethers.Contract(linkTokenAddress, linkTokenContract.interface, signer);

    let fund_tx = await linkToken.transfer(RandomSVG.address, fee);

    await fund_tx.wait(1);

    // Create an NFT! by calling a random number

    const RandomSVGContract = await ethers.getContractFactory("RandomSVG");

    const randomSVG = new ethers.Contract(RandomSVG.address, RandomSVGContract.interface, signer);

    let creation_tx = await randomSVG.create({gasLimit: 300000 });

    let receipt = await creation_tx.wait(1);

    let tokenId = receipt.events[3].topics[2];

    log(`You've made your NFT! This is token number ${tokenId.toString()}`);

    log(`Let's wait for the Chainlink node to respond..`);

    if(chainId != 31337) {

    } else {
        const VRFCoordinatorMock = await deployments.get("VRFCoordinatorMock");

        vrfCoordinator = await ethers.getContractAt("VRFCoordinatorMock", VRFCoordinatorMock.address, signer);

        let vrf_tx = await vrfCoordinator.callBackWithRandomness(receipt.logs[3].topics[1], 77777, randomSVG.address);

        await vrf_tx.wait(1);

        log("Now let's finish the mint!");

        let finish_tx = await randomSVG.finishMint(tokenId, {gasLimit: 2000000});

        await finish_tx.wait(1);

        log(`You can view the tokenURI here: ${await randomSVG.tokenURI(tokenId)}`);
    }

}

module.exports.tags = ["all", "rsvg"];