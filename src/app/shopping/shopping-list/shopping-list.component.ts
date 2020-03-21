import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-shopping-list',
  templateUrl: './shopping-list.component.html',
  styleUrls: ['./shopping-list.component.scss']
})
export class ShoppingListComponent implements OnInit, OnChanges {
  @Input() items;
  @Output() selectItem = new EventEmitter();
  lang = environment.language;
  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(e) {
    this.items = e.items.currentValue;
  }

  onSelect(item) {
    this.selectItem.emit(item);
  }
}
