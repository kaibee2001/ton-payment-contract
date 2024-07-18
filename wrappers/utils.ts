import { Cell, Dictionary } from '@ton/core';

export function arrayToCell(arr: Array<Cell>): Dictionary<number, Cell> {
    const dict = Dictionary.empty(Dictionary.Keys.Uint(8), Dictionary.Values.Cell());
    for (let i = 0; i < arr.length; i++) {
        dict.set(i + 1, arr[i]);
    }
    return dict;
}

export function cellToArray(addrDict: Cell | null): Array<Cell> {
    let resArr: Array<Cell> = [];
    if (addrDict !== null) {
        const dict = Dictionary.loadDirect(Dictionary.Keys.Uint(8), Dictionary.Values.Cell(), addrDict);
        resArr = dict.values();
    }
    return resArr;
}
