import { Injectable } from '@angular/core';
import { ICart, ICartItem } from './cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  constructor() { }

  getTotalPrice(cart) { // group by date time
    let total = 0;
    cart.map(it => { //  {productId, productName, deliveries:[{date, time, price, quantity }]}
      it.deliveries.map(d => {
        const quantity = d.quantity ? d.quantity : 0;
        total += it.product.price * quantity;
      });
    });
    return total;
  }
}
