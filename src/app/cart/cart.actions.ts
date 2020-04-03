export class CartActions {
  static UPDATE_CART = 'UPDATE_CART';
  static ADD_TO_CART = 'ADD_TO_CART';
  static REMOVE_FROM_CART = 'REMOVE_FROM_CART';
  static UPDATE_QUANTITY = 'UPDATE_QUANTITY';
  static CLEAR_CART = 'CLEAR_CART';
  static UPDATE_FROM_CHANGE_ORDER = 'UPDATE_CART_FROM_CHANGE_ORDER'; // clear the items from the same merchant and re-add items

}



// item - {product:{_id, price, cost, taxRate }, delivery: {date, time, quantity} }
export const addToCart = (item) => {
  return {
    type: 'ADD_TO_CART',
    payload: item
  };
};

// item - {product:{_id, price, cost, taxRate }, delivery: {date, time, quantity} }
export const removeFromCart = (item) => {
  return {
    type: 'REMOVE_FROM_CART',
    payload: item
  };
};

// item - {product:{_id, price, cost, taxRate }, delivery: {date, time, quantity} }
export const changeQuantity = (item) => {
  return {
    type: CartActions.UPDATE_QUANTITY,
    payload: item
  };
};

export const updateLocation = (loc) => {
  return {
    type: 'UPDATE_LOCATION',
    payload: loc
  };
};

export const updateMerchant = (merchant) => {
  return {
    type: 'UPDATE_MERCHANT',
    payload: merchant
  };
};
