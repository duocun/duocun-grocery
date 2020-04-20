import { IOrder } from './order.model';
import { OrderActions, PaymentActions } from './order.actions';
import { PaymentMethod } from '../payment/payment.model';

export interface IOrderAction {
  type: string;
  payload: IOrder[];
}

export interface IPayment {
  paymentMethod: string;
  paymentMethodId: string;  // stripe paymentMethodId
}

export const DEFAULT_PAYMENT = {
  paymentMethod: PaymentMethod.WECHAT,
  paymentMethodId: ''
};


export function orderReducer(state: IOrder[] = [], action: any) {
  if (action.payload) {
    switch (action.type) {
      case OrderActions.REPLACE_ORDERS:
        return action.payload;

      case OrderActions.UPDATE_ORDERS:
        return state.map(order => {
          return { ...order, ...action.payload };
        });

      case OrderActions.CLEAR_ORDERS:
        return [];
    }
  }
  return state;
}

export function paymentReducer(state = DEFAULT_PAYMENT, action: any) {
  if (action.payload) {
    switch (action.type) {
      case PaymentActions.UPDATE_PAYMENT_METHOD:
        return { ...state, ...action.payload };
      case PaymentActions.CLEAR_PAYMENT_METHOD:
        return {};
    }
  }
  return state;
}