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
import { orderReducer, paymentReducer, DEFAULT_PAYMENT, IPayment } from './order/order.reducers';
import { IOrder } from './order/order.model';
import { addressReducer } from './location/address.reducer';
import { merchantReducer } from './merchant/merchant.reducer';
export interface IAppState {
    cart: any; // ICart;
    account: Account;
    appState: IApp;
    payment: IPayment;
    page: string;
    cmd: ICommand;
    merchant: IMerchant;
    delivery: IDelivery;
    contact: IContact;
    orders: IOrder[];
    address: string;
}

export const INITIAL_STATE: IAppState = {
    cart: DEFAULT_CART,
    account: null,
    appState: DEFAULT_APP,
    payment: DEFAULT_PAYMENT,
    page: 'home',
    cmd: {name: '', args: ''},
    merchant: null,
    delivery: DEFAULT_DELIVERY,
    contact: null,
    orders: null,
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
    payment: paymentReducer,
    page: pageReducer,
    cmd: commandReducer,
    merchant: merchantReducer,
    delivery: deliveryReducer,
    contact: contactReducer,
    orders: orderReducer,
    address: addressReducer
});
