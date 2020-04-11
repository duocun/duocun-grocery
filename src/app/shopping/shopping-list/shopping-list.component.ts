import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss']
})
export class ShoppingListComponent implements OnInit, OnChanges {
  @Input() items;
  @Input() productId;
  @Output() selectItem = new EventEmitter();
  lang = environment.language;
  @ViewChild('list', { static: true }) list: ElementRef;

  constructor() {

  }

  ngOnInit() {
    if (this.productId) {
      this.list.nativeElement.querySelector('#pId' + this.productId).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  ngOnChanges(e) {
    this.items = e.items.currentValue;
  }

  onSelect(item) {
    this.selectItem.emit(item);
  }
}
