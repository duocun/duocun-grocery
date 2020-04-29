import { Injectable } from '@angular/core';
import { ICart, ICartItem } from './cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  constructor() { }

  getProductQuantity(cart, date, time, productId) {
    const dt = date + 'T' + time;
    const cartGroup = cart[dt];
    const merchantMap = cartGroup ? cartGroup.merchantMap : null;
    let quantity = 0;
    if (merchantMap) {
      const mIds = Object.keys(merchantMap);
      mIds.forEach(mId => {
        const productMap = merchantMap[mId].productMap;
        const pIds = Object.keys(productMap);
        pIds.forEach(pId => {
          if (pId === productId) {
            quantity += productMap[pId].quantity;
          }
        });
      });
    }
    return quantity;
  }
  // cart:
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
  getTotal(cart) {
    let total = 0;
    const delivers = Object.keys(cart);
    delivers.forEach((dt) => {
      const merchantMap = cart[dt].merchantMap;
      const merchantIds = Object.keys(merchantMap);
      merchantIds.forEach((mId) => {
        const productMap = merchantMap[mId].productMap;
        const productIds = Object.keys(productMap);
        productIds.forEach((pId) => {
          const quantity = (+productMap[pId].quantity) ? (+productMap[pId].quantity) : 0;
          const product = productMap[pId].product;
          if (product) {
            const price = +product.price;
            const taxRate = +product.taxRate;
            total += price * quantity * (100 + taxRate) / 100;
          }
        });
      });
    });
    return Math.round(total * 100) / 100;
  }
  // cart --- [{product, deliveries: [{date, time, quantity}] }]
  // getTotal(cart) {
  //   let total = 0;
  //   cart.forEach((v) => {
  //     const price = v.product.price;
  //     const taxRate = v.product.taxRate;
  //     v.deliveries.forEach((d) => {
  //       const quantity = d.quantity ? d.quantity : 0;
  //       total += price * quantity * (100 + taxRate) / 100;
  //     });
  //   });
  //   return Math.round(total * 100) / 100;
  // }
}
