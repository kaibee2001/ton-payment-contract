export abstract class OpVault {
    // jetton op-codes
    static mint = 21;
    static change_admin = 3;
    static internal_transfer = 0x178d4519;
    static mint_token = 12;
    static update_code = 23;
    static create_minter = 22;
    static change_owner = 945;
    static set_fee = 946;
    static transfer_fee = 947;
    static sell_jetton = 3564112961;
    static buy_jetton = 3982045493;

    // vault pay op-codes
    static deposit_token = 0xd561bce0;
    static claim_token = 0x637a4a7d;
    static withdraw_token = 0x4d3e90df;
    static set_pause = 0x436b6e8b;
    static set_payment_token = 0x476c2574;
    static set_signer = 0x4e2a5803;
    static set_admin = 0x1cfff110;
    static init_code_upgrade = 0xdf1e233d;
    static check_signature_test = 0x21fc3f58;
}

export abstract class DexType {
    static STONFI_DEX = 1;
    static DEDUST_DEX = 2;
}

export abstract class TonFunConstants {
    static FEE_DIVIDER = 10000n;
}

export abstract class EventId {}
