import { CartActions } from './cart.actions';
import { ICart, ICartItem } from './cart.model';


import { combineReducers } from 'redux';


export const DEFAULT_CART = {};
const DEFAULT_LOCATION = {};
const DEFAULT_MERCHANT = {};


  // cart: (state)
  //  {date + T + time: {// map key
  //    date,
  //    time,
  //    merchantMap:
  //      { merchantId: { // map key
  //        merchant: {_id, name }, // merchant Name
  //        productMap:
  //          {productId: { // map key
  //            product: {_id, name, price, cost, taxRate},
  //            quantity
  //          }
  //        ]
  //      },
  //    ]
  //  }
// payload --- { merchant: {_id, name}, product:{_id, price, cost, taxRate }, delivery: {date, time, quantity} }
const updateQuantity = (state, payload) => {
  const product = payload.product;
  const date = payload.delivery.date;
  const time = payload.delivery.time;
  const quantity = +payload.delivery.quantity;
  const merchantId = payload.merchant._id;
  const merchant = payload.merchant;
  const productId = payload.product._id;

  const deliverMap = {...state};
  const dt = date + 'T' + time;
  const deliver = deliverMap[dt];

  if (deliver) {
    const m = deliver.merchantMap[merchantId];
    if (m) {
      const p = m.productMap[productId];
      if (p) {
        p.quantity = quantity;
      } else {
        m.productMap[productId] = { product, quantity };
      }
    } else {
      const productMap = {};
      productMap[productId] = { product, quantity };
      deliver.merchantMap[merchantId] = { merchant,  productMap };
    }
    return deliverMap;
  } else {
    const merchantMap = {};
    const productMap = {};
    productMap[productId] = { product, quantity };
    merchantMap[merchantId] = { merchant,  productMap };
    deliverMap[dt] = {date, time, merchantMap};
    return deliverMap;
  }
};

// state --- old: [{ product, deliveries:[{date, time, quantity}] }]
// payload --- { merchantId, merchantName, product:{_id, price, cost, taxRate }, delivery: {date, time, quantity} }
// const updateQuantity = (state, payload) => {
//   const product = payload.product;
//   const date = payload.delivery.date;
//   const time = payload.delivery.time;
//   const quantity = payload.delivery.quantity;

//   const item = state.find(it => it.product && it.product._id === product._id);
//   if (item) {
//     let deliveries = [];
//     const found = item.deliveries.find(d => (d.date + d.time) === (date + time));
//     if (found) {
//       item.deliveries.map(d => {
//         if ((d.date + d.time) === (date + time)) {
//           deliveries.push({ ...d, quantity: quantity });
//         } else {
//           deliveries.push(d);
//         }
//       });
//     } else {
//       deliveries = [...item.deliveries, payload.delivery];
//     }
//     deliveries = deliveries.filter(d => d.quantity > 0);
//     const remain = state.filter(it => it.product && it.product._id !== product._id);
//     return [...remain, { product, deliveries }];
//   } else {
//     const remain = state.filter(it => it.product._id !== product._id);
//     const delivery = { ...payload.delivery, quantity: quantity };
//     const deliveries = [delivery];

//     return [...remain, { product, deliveries }];
//   }
//   // return state;
// };

// action.payload - eg. {product, delivery:{date, time, quantity}}
export const cartReducer = (state = DEFAULT_CART, action) => {
  const payload = action.payload;

  switch (action.type) {
    // case 'ADD_TO_CART':
    //   return updateQuantity(state, payload);

    // case 'REMOVE_FROM_CART':
    //   return updateQuantity(state, payload);

    case CartActions.UPDATE_QUANTITY:
      return updateQuantity(state, payload);

    case CartActions.CLEAR_CART:
      return {};
    default:
      return state;
  }
};

export const locationReducer = (state = DEFAULT_LOCATION, action) => {
  const payload = action.payload;
  switch (action.type) {
    case 'UPDATE_LOCATION':
      return payload;
    default:
      return state;
  }
};

export const merchantReducer = (state = DEFAULT_MERCHANT, action) => {
  const payload = action.payload;
  switch (action.type) {
    case 'UPDATE_MERCHANT':
      return payload;
    default:
      return state;
  }
};

export default combineReducers({
  cart: cartReducer,
  location: locationReducer,
  merchant: merchantReducer
});

// export interface ICartAction {
//   type: string;
//   payload: ICart;
// }

// if items is [], means empty cart
// function updateCart(c: ICart, items: ICartItem[]) {
//   const cart = Object.assign({}, c);
//   cart.price = 0;
//   cart.quantity = 0;

//   if (items && items.length > 0) {
//     items.map(x => {
//       cart.price += x.price * x.quantity;
//       cart.quantity += x.quantity;
//     });
//   } else { // clear cart
//     cart.merchantId = '';
//     cart.merchantName = '';
//   }
//   return cart;
// }

// export const DEFAULT_CART = {
//   merchantId: '',
//   merchantName: '',
//   quantity: 0,
//   price: 0,
//   items: []
// };

// export function cartReducer(state: ICart = DEFAULT_CART, action: ICartAction) {
//   const items = [];
//   let updated = null;
//   let its = [];

//   if (action.payload) {
//     // const item = state.items.find(x => x.productId === payload.productId);

//     switch (action.type) {
//       case CartActions.UPDATE_CART:
//         return {
//           ...state,
//           ...action.payload.items
//         };

//       case CartActions.UPDATE_QUANTITY:
//         const itemsToUpdate = action.payload.items;

//         itemsToUpdate.map(itemToUpdate => {
//           const x = state.items.find(item => item.productId === itemToUpdate.productId);
//           if (x) {
//             x.quantity = itemToUpdate.quantity;
//           } else {
//             items.push({ ...itemToUpdate });
//           }
//         });

//         state.items.map(x => {
//           const it = items.find(y => y.productId === x.productId);
//           if (!it) {
//             items.push(x);
//           }
//         });

//         its = items.filter(x => x.quantity > 0);
//         updated = updateCart(state, its);

//         return {
//           ...state,
//           ...updated,
//           items: its
//         };

//       case CartActions.ADD_TO_CART:
//         const itemsToAdd = action.payload.items;

//         // add all into items variable
//         itemsToAdd.map(itemToAdd => {
//           const x = state.items.find(item => item.productId === itemToAdd.productId);
//           if (x) {
//             items.push({ ...x, quantity: x.quantity + itemToAdd.quantity });
//           } else {
//             items.push({ ...itemToAdd });
//           }
//         });

//         state.items.map(x => {
//           const it = items.find(y => y.productId === x.productId);
//           if (!it) {
//             items.push(x);
//           }
//         });

//         updated = updateCart(state, items);
//         return {
//           ...state,
//           ...updated,
//           items: items,
//           merchantId: action.payload.merchantId,
//           merchantName: action.payload.merchantName
//         };
//       case CartActions.REMOVE_FROM_CART:
//         const itemsToRemove: ICartItem[] = action.payload.items;
//         itemsToRemove.map((itemToRemove: ICartItem) => {
//           const x = state.items.find(item => item.productId === itemToRemove.productId);
//           if (x) {
//             items.push({ ...x, quantity: x.quantity - itemToRemove.quantity });
//           }
//         });
//         state.items.map(x => {
//           const it = items.find(y => y.productId === x.productId);
//           if (!it) {
//             items.push(x);
//           }
//         });

//         its = items.filter(x => x.quantity > 0);
//         updated = updateCart(state, its);

//         return {
//           ...state,
//           ...updated,
//           items: its
//         };

//       case CartActions.UPDATE_FROM_CHANGE_ORDER: // deprecated
//         its = [...action.payload.items];
//         updated = updateCart(state, its);

//         return {
//           ...state,
//           ...updated,
//           merchantId: action.payload.merchantId,
//           merchantName: action.payload.merchantName,
//           items: its
//         };

//       case CartActions.CLEAR_CART:
//         updated = updateCart(state, []);
//         return {
//           ...state,
//           ...updated,
//           items: []
//         };
//     }
//   }

//   return state;
// }
