import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { ProductStatus } from '../../product/product.model';
import { environment } from '../../../environments/environment';
const MEDIA_URL = environment.MEDIA_URL;
@Component({
  selector: 'app-shopping-item',
  templateUrl: './shopping-item.component.html',
  styleUrls: ['./shopping-item.component.scss']
})
export class ShoppingItemComponent implements OnInit, OnChanges {

  @Input() item;
  @Output() select = new EventEmitter();

  Status = ProductStatus;
  product;
  quantity;

  constructor() { }

  ngOnInit() {
    this.product = this.item.product;
    this.quantity = this.item.quantity;
  }

  ngOnChanges(e) {
    this.item = e.item.currentValue;
    this.product = this.item.product;
    this.quantity = this.item.quantity;
  }

  getProductImage(p) {
    if (p.pictures && p.pictures[0] && p.pictures[0].url) {
      return MEDIA_URL + p.pictures[0].url;
    } else {
      return null;
    }
  }

  onSelect(product, quantity) {
    this.select.emit({ product, quantity });
  }
}
