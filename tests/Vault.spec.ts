import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, Cell, Contract, beginCell, toNano } from '@ton/core';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { Vault } from '../wrappers/Vault';
import { JettonMinter, jettonContentToCell } from '../wrappers/JettonMinter';
import { JettonWallet } from '../wrappers/JettonWallet';

describe('Vault', () => {
    let jettonMinterCode: Cell;
    let jettonWalletCode: Cell;
    let vaultCode: Cell;
    let blockchain: Blockchain;
    let vaultDeployer: SandboxContract<TreasuryContract>;
    let customer: SandboxContract<TreasuryContract>;
    let claimer: SandboxContract<TreasuryContract>;
    let jettonDeployer: SandboxContract<TreasuryContract>;
    let signerAddress: SandboxContract<TreasuryContract>;
    let vault: SandboxContract<Vault>;
    let jettonMinter: SandboxContract<JettonMinter>;
    let jettonDefaultContent: Cell;

    let userWallet: (address: Address) => Promise<SandboxContract<JettonWallet>>;
    let vaultJettonWallet: SandboxContract<JettonWallet>;

    beforeAll(async () => {
        vaultCode = await compile('Vault');
        jettonMinterCode = await compile('JettonMinter');
        jettonWalletCode = await compile('JettonWallet');

        blockchain = await Blockchain.create();
        signerAddress = await blockchain.treasury('signerAddress');
        vaultDeployer = await blockchain.treasury('tonFunFactoryDeployer');
        customer = await blockchain.treasury('customer');
        claimer = await blockchain.treasury('claimer');

        jettonDefaultContent = jettonContentToCell({
            type: 1,
            uri: 'https://gateway.pinata.cloud/ipfs/QmUgrgL7SdSgdwfwdWoi2A5ta4o9sZ3qMjyP5Zt7mTXpya',
        });

        jettonDeployer = await blockchain.treasury('jettonDeployer');
        jettonMinter = blockchain.openContract(
            JettonMinter.createFromConfig(
                {
                    admin: jettonDeployer.address,
                    content: jettonDefaultContent,
                    wallet_code: jettonWalletCode,
                },
                jettonMinterCode,
            ),
        );
        const jettonMinterDeployResult = await jettonMinter.sendDeploy(jettonDeployer.getSender(), toNano('0.05'));
        expect(jettonMinterDeployResult.transactions).toHaveTransaction({
            from: jettonDeployer.address,
            to: jettonMinter.address,
            deploy: true,
            success: true,
        });

        vault = blockchain.openContract(
            Vault.createFromConfig(
                {
                    signerAddress: signerAddress.address,
                    adminAddress: vaultDeployer.address,
                    paymentTokenAddress: jettonMinter.address,
                    jettonWalletCode: jettonWalletCode,
                    paused: 0,
                },
                vaultCode,
            ),
        );
        const vaultResult = await vault.sendDeploy(vaultDeployer.getSender(), toNano('0.05'));
        expect(vaultResult.transactions).toHaveTransaction({
            from: vaultDeployer.address,
            to: vault.address,
            success: true,
            deploy: true,
        });

        userWallet = async (address: Address) =>
            blockchain.openContract(JettonWallet.createFromAddress(await jettonMinter.getWalletAddress(address)));
    });

    beforeEach(async () => {});

    it('should deploy', async () => {
        const vaultData = await vault.getVaultData();
    });

    it('should mint token', async () => {
        const initialTotalSupply = await jettonMinter.getTotalSupply();
        console.log('initTotlSupply', initialTotalSupply);
        const initialJettonBalance = toNano('1000000000000.23');
        const mintResult = await jettonMinter.sendMint(
            jettonDeployer.getSender(),
            customer.address,
            initialJettonBalance,
            toNano('0.05'),
            toNano('1'),
        );

        const customerJettonWallet = await userWallet(customer.address);

        expect(mintResult.transactions).toHaveTransaction({
            from: jettonMinter.address,
            to: customerJettonWallet.address,
            deploy: true,
        });

        expect(mintResult.transactions).toHaveTransaction({
            // excesses
            from: customerJettonWallet.address,
            to: jettonMinter.address,
        });

        expect(await customerJettonWallet.getJettonBalance()).toEqual(initialJettonBalance);
        expect(await jettonMinter.getTotalSupply()).toEqual(initialTotalSupply + initialJettonBalance);
    });

    it('wallet owner should be able send jettons to vault', async () => {
        const customerJettonWallet = await userWallet(customer.address);
        const initialJettonBalance = await customerJettonWallet.getJettonBalance();
        const initialTotalSupply = await jettonMinter.getTotalSupply();
        const notDeployerJettonWallet = await userWallet(vault.address);
        const initialJettonBalance2 = await notDeployerJettonWallet.getJettonBalance();
        const sentAmount = 1000000000n;
        const forwardAmount = toNano('0.05');
        const sendResult = await customerJettonWallet.sendTransfer(
            customer.getSender(),
            toNano('0.1'), //tons
            sentAmount,
            vault.address,
            customer.address,
            null,
            forwardAmount,
            null,
        );
        expect(await customerJettonWallet.getJettonBalance()).toEqual(initialJettonBalance - sentAmount);
        expect(await notDeployerJettonWallet.getJettonBalance()).toEqual(initialJettonBalance2 + sentAmount);
        expect(await jettonMinter.getTotalSupply()).toEqual(initialTotalSupply);
    });

    it('should claim by claimer', async () => {
        const tokenBalances = 10000n;
        const sentAmount = 1000000000n;
        const claimResult = await vault.sendClaim(claimer.getSender(), tokenBalances);

        const vaultWallet = await userWallet(vault.address);
        expect(await vaultWallet.getJettonBalance()).toEqual(sentAmount - tokenBalances);
    });

    it('should check signature', async () => {
        const checkResult = await vault.sendCheckSignature(customer.getSender());

        expect(checkResult.transactions).toHaveTransaction({
            from: customer.address,
            success: true,
        });
    });

    // Upgrade code

    it('should upgrade vault code', async () => {
        const upgradeCodeResult = await vault.sendUpgradeCode(
            vaultDeployer.getSender(),
            toNano('0.1'),
            0n,
            jettonMinterCode,
        );

        expect(upgradeCodeResult.transactions).toHaveTransaction({
            from: vaultDeployer.address,
            to: vault.address,
            value: toNano('0.1'),
            success: true,
        });
    });
});
