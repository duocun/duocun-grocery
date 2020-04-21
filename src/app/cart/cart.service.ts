import { Injectable } from '@angular/core';
import { ICart, ICartItem } from './cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  constructor() { }

  // cart --- [{product, deliveries: [{date, time, quantity}] }]
  getTotal(cart) {
    let total = 0;
    cart.forEach((v) => {
      const price = v.product.price;
      const taxRate = v.product.taxRate;
      v.deliveries.forEach((d) => {
        const quantity = d.quantity ? d.quantity : 0;
        total += price * quantity * (100 + taxRate) / 100;
      });
    });
    return Math.round(total * 100) / 100;
  }
}
