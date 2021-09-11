module.exports = async({
    getNamedAccounts,
    deployments,
    getChainId
}) => {
    const {deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = await getChainId();

    if(chainId == 31337) {
        log("Local network detected! Deploying Mocks...");

        const LinkToken = await deploy("LinkToken", { from: deployer, log: true });

        const VRFCoordinatorMock = await deploy("VRFCoordinatorMock", 
        { 
            from: deployer, 
            logs: true,
            args: [LinkToken.address]
        });

        log("Mocks deployed!");
    }
}

module.exports.tags = ["all", "rsvg", "svg"];