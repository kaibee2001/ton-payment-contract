import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'func',
    targets: [
        'contracts/imports/stdlib.fc',
        'contracts/common/params.fc',
        'contracts/common/jetton-utils.fc',
        'contracts/vault/op-codes.fc',
        'contracts/vault/storage.fc',
        'contracts/vault/params.fc',
        'contracts/vault/logger.fc',
        'contracts/vault/vault-utils.fc',
        'contracts/vault/user-calls.fc',
        'contracts/vault/admin-calls.fc',
        'contracts/vault/get.fc',
        'contracts/vault/vault.fc',
    ],
};
