export interface IBond {
    bondDid: string;
    token: string;
    name: string;
    description: string;
    creatorDid: string;
};

export interface IPriceEntry {
    bondDid: string;
    time: Date;
    denom?: string;
    price: number;
};

export class NewBondInfo {
    did: string;
    spotPrice: any;
    supply: any;
    reserve: any;
    blockHeight: number;
    blockTimestamp: Date;

    constructor(did: string, spotPrice: any, supply: any, reserve: any, blockHeight: number, blockTimestamp: Date) {
        this.did = did;
        this.spotPrice = spotPrice;
        this.supply = supply;
        this.reserve = reserve;
        this.blockHeight = blockHeight;
        this.blockTimestamp = blockTimestamp;
    };

    hasMultiplePrices(): boolean {
        return this.spotPrice.length > 1;
    };
}

export class NewBondsInfo {
    bondsInfo: any[];
    blockHeight: number;
    blockTimestamp: Date;

    constructor(bondsInfo: any[], blockHeight: number, blockTimestamp: Date) {
        this.bondsInfo = bondsInfo;
        this.blockHeight = blockHeight;
        this.blockTimestamp = blockTimestamp;
    };

    getBondsInfo(): any {
        return this.bondsInfo;
    };

    getBondInfo(i: number): NewBondInfo {
        return new NewBondInfo(
            this.bondsInfo[i].did,
            this.bondsInfo[i].spot_price,
            this.bondsInfo[i].supply,
            this.bondsInfo[i].reserve,
            this.blockHeight,
            this.blockTimestamp
        );
    };
};