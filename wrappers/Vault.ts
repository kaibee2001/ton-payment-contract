import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    Sender,
    SendMode,
    Slice,
    toNano,
} from '@ton/core';
import { OpVault } from './Constants';
import { hash } from 'crypto';

export type VaultConfig = {
    signerAddress: Address;
    adminAddress: Address;
    paymentTokenAddress: Address;
    jettonWalletCode: Cell;
    paused: number;
};

export function vaultConfigToCell(config: VaultConfig): Cell {
    return beginCell()
        .storeAddress(config.signerAddress)
        .storeAddress(config.adminAddress)
        .storeAddress(config.paymentTokenAddress)
        .storeRef(config.jettonWalletCode)
        .storeUint(config.paused, 1)
        .endCell();
}

export class Vault implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new Vault(address);
    }

    static createFromConfig(config: VaultConfig, code: Cell, workchain = 0) {
        const data = vaultConfigToCell(config);
        const init = { code, data };
        return new Vault(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    static depositMessage(
        jettonMasterAddress: Address,
        forwardTonAmount: bigint,
        tokenBalances: bigint,
        query_id: number | bigint = 0,
    ): Cell {
        return beginCell()
            .storeUint(OpVault.deposit_token, 32)
            .storeUint(query_id, 64)
            .storeAddress(jettonMasterAddress)
            .storeCoins(forwardTonAmount)
            .storeCoins(tokenBalances)
            .endCell();
    }

    async sendDeposit(provider: ContractProvider, via: Sender, jettonMasterAddress: Address, tokenBalances: bigint) {
        await provider.internal(via, {
            value: toNano(0.05),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: Vault.depositMessage(jettonMasterAddress, toNano(0.03), tokenBalances),
        });
    }

    static claimMessage(forwardTonAmount: bigint, tokenBalances: bigint, query_id: bigint | number = 0): Cell {
        return beginCell()
            .storeUint(OpVault.claim_token, 32)
            .storeUint(query_id, 64)
            .storeCoins(forwardTonAmount)
            .storeCoins(tokenBalances)
            .endCell();
    }

    async sendClaim(provider: ContractProvider, via: Sender, tokenBalances: bigint) {
        await provider.internal(via, {
            value: toNano(0.15),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: Vault.claimMessage(toNano(0.1), tokenBalances),
        });
    }

    static checkSignatureMessage(value: bigint, query_id: number | bigint = 0): Cell {
        const hashValue = BigInt('0x' + beginCell().storeCoins(value).endCell().hash().toString('hex'));
        return beginCell()
            .storeUint(OpVault.check_signature_test, 32)
            .storeUint(query_id, 64)
            .storeUint(hashValue, 256)
            .storeCoins(value)
            .endCell();
    }

    async sendCheckSignature(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: toNano(0.1),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: Vault.checkSignatureMessage(1000n),
        });
    }

    // Admin action

    static upgradeCodeMessage(query_id: bigint, new_code: Cell): Cell {
        return beginCell()
            .storeUint(OpVault.init_code_upgrade, 32)
            .storeUint(query_id, 64)
            .storeRef(new_code)
            .endCell();
    }

    async sendUpgradeCode(provider: ContractProvider, via: Sender, value: bigint, query_id: bigint, new_code: Cell) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: Vault.upgradeCodeMessage(query_id, new_code),
        });
    }

    // Get data

    async getVaultData(provider: ContractProvider) {
        const result = await provider.get('get_vault_data', []);
        const signerAddress = result.stack.readAddress();
        const adminAddress = result.stack.readAddress();
        const tokenPaymentAddress = result.stack.readAddress();
        const jettonWalletCode = result.stack.readCell();
        const paused = result.stack.readBigNumber();
        return {
            signerAddress,
            adminAddress,
            tokenPaymentAddress,
            jettonWalletCode,
            paused,
        };
    }
}
