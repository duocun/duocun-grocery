import { combineReducers } from 'redux';
import { accountReducer } from './account/account.reducer';
import { pageReducer, AppState, appStateReducer, IApp, DEFAULT_APP } from './main/main.reducers';
import { commandReducer, ICommand } from './shared/command.reducers';
import { IDelivery } from './delivery/delivery.model';
import { deliveryReducer, DEFAULT_DELIVERY } from './delivery/delivery.reducer';
import { IContact } from './contact/contact.model';
import { contactReducer } from './contact/contact.reducer';
import { cartReducer, DEFAULT_CART } from './cart/cart.reducer';
import { IMerchant } from './merchant/merchant.model';
import { Account } from './account/account.model';
import { orderReducer } from './order/order.reducers';
import { IOrder } from './order/order.model';
import { addressReducer } from './location/address.reducer';
import { merchantReducer } from './merchant/merchant.reducer';
export interface IAppState {
    cart: any; // ICart;
    account: Account;
    appState: IApp;
    // location: ILocation;
    page: string;
    cmd: ICommand;
    // deliveryTime: IDeliveryTime;
    merchant: IMerchant;
    delivery: IDelivery;
    contact: IContact;
    order: IOrder;
    address: string;
}

export const INITIAL_STATE: IAppState = {
    cart: DEFAULT_CART,
    account: null,
    appState: DEFAULT_APP,
    // location: null,
    page: 'home',
    cmd: {name: '', args: ''},
    // deliveryTime: {text: '', from: null, to: null},
    merchant: null,
    delivery: DEFAULT_DELIVERY,
    contact: null,
    order: null,
    address: ''
};

// export function rootReducer(last:IAppState, action:Action):IAppState{
// 	// switch (action.type){
// 	// 	case DashboardActions.SHOW_DASHBOARD:
// 	// 		return { dashboard: 'main' };
// 	// 	case DashboardActions.HIDE_DASHBOARD:
// 	// 		return { dashboard: ''};
// 	// }
// 	return last;
// }

export const rootReducer = combineReducers({
    cart: cartReducer,
    account: accountReducer,
    appState: appStateReducer,
    // location: locationReducer,
    page: pageReducer,
    cmd: commandReducer,
    // deliveryTime: deliveryTimeReducer,
    merchant: merchantReducer,
    delivery: deliveryReducer,
    contact: contactReducer,
    order: orderReducer,
    address: addressReducer
});
