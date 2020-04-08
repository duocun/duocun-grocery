import { IOrder } from './order.model';
import { OrderActions, PaymentActions } from './order.actions';

export interface IOrderAction {
  type: string;
  payload: IOrder[];
}

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

export function paymentReducer(state = {}, action: any) {
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