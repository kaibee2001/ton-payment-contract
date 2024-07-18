import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
	targets: [
		'contracts/imports/stdlib.fc',
		'contracts/common/params.fc',
		'contracts/common/jetton-op-codes.fc',
		'contracts/common/jetton-utils.fc',
		'contracts/jetton/jetton-minter.fc',
	],
};
