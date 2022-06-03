import {BondSyncHandler} from "./bonds_sync_handler";
import {NewBondsInfo} from "../models/bonds";

export class BondHandler {
  private bondSyncHandler = new BondSyncHandler();

  routeNewBondsInfo(bondsInfo: NewBondsInfo) {
    // Add bond info for all bonds, one at a time
    for (let i: number = 0; i < bondsInfo.bondsInfo.length; i++) {
      const bondInfo = bondsInfo.getBondInfo(i);

      // Only add bond info if bond has one price
      if (!bondInfo.hasMultiplePrices()) {
        this.bondSyncHandler.addBondInfo(bondInfo)
      }   
      
      // if (bondInfo.hasMultiplePrices()) {
      //   this.bondSyncHandler.addBondInfoInitialPrice(bondInfo)
      // }
    }
  }
  
  

 



}
