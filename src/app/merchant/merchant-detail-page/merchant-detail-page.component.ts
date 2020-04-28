import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MerchantService } from '../merchant.service';
import { IMerchant } from '../../merchant/merchant.model';
import { ProductService } from '../../product/product.service';
import { NgRedux } from '@angular-redux/store';
import { ICart, ICartItem } from '../../cart/cart.model';
import { PageActions } from '../../main/main.actions';
import { MatDialog } from '@angular/material';
import { QuitMerchantDialogComponent } from '../quit-merchant-dialog/quit-merchant-dialog.component';
import { IDelivery } from '../../delivery/delivery.model';
import { environment } from '../../../environments/environment';
import { CartActions } from '../../cart/cart.actions';
import { CartService } from '../../cart/cart.service';
import { OrderFormAction } from '../../order/order-form-page/order-form-page.component';
import { AccountService } from '../../account/account.service';
import { PaymentMethod } from '../../payment/payment.model';
import { IPayment } from '../../order/order.reducers';
import { PaymentActions } from '../../order/order.actions';
import { ProductStatus } from '../../product/product.model';


@Component({
  selector: 'app-merchant-detail-page',
  templateUrl: './merchant-detail-page.component.html',
  styleUrls: ['./merchant-detail-page.component.scss']
})
export class MerchantDetailPageComponent implements OnInit, OnDestroy {
  categories: any[];

  onDestroy$ = new Subject<any>();
  locationSubscription;
  dow: number; // day of week
  cart;
  delivery: IDelivery;
  lang = environment.language;
  onSchedule: boolean;
  bHasAddress: boolean;
  dialogRef;
  action = '';
  currentUrl;

  products;
  merchant: IMerchant;
  subscription;
  amount = 0;
  items;
  account;
  paymentMethod;

  @ViewChild('list', { static: true }) list: ElementRef;

  constructor(
    private productSvc: ProductService,
    private merchantSvc: MerchantService,
    private cartSvc: CartService,
    private accountSvc: AccountService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private rx: NgRedux<ICart>,
    public dialog: MatDialog
  ) {
    const self = this;

    // show cart on footer
    this.rx.dispatch({ type: PageActions.UPDATE_URL, payload: { name: 'restaurant-detail' } });

    this.rx.select('delivery').pipe(takeUntil(this.onDestroy$)).subscribe((x: IDelivery) => {
      self.delivery = x;
      self.bHasAddress = x.origin ? true : false;
    });

    this.rx.select('cart').pipe(takeUntil(this.onDestroy$)).subscribe(cart => {
      this.cart = cart;
      // // update quantity of cart items
      // if (self.groups && self.groups.length > 0) {
      //   self.groups = this.mergeQuantityFromCart(self.groups, cart);
      // }
      if (cart) {
        // const ds = this.getDeliverySchedule();
        // this.deliveries = this.mergeQuantity(ds, cart, this.product._id);
        this.amount = this.cartSvc.getTotal(cart);
      }
    });

    this.rx.select('payment').pipe(takeUntil(this.onDestroy$)).subscribe((r: IPayment) => {
      this.paymentMethod = r.paymentMethod;
    });

    this.locationSubscription = this.location.subscribe((x) => {
      const merchantId = self.merchant._id;

      if (window.location.pathname.endsWith('main/home') || window.location.pathname.endsWith('/') ||
        window.location.pathname.endsWith('contact/address-form')
      ) {
        if (self.cart && self.cart.length > 0) {
          self.openQuitMerchantDialog(merchantId);
        }
      } else if (window.location.pathname.endsWith('order/history')) {
        // if (self.restaurant && self.cart && self.cart.items && self.cart.items.length > 0) {
        //   this.openDialog(merchantId, 'order-history');
        // }
      }
    });

  }

  ngOnInit() {
    const self = this;
    // const balance = Math.round(this.state.account.balance * 100) / 100;
    // const payable = Math.round((balance >= this.summary.total ? 0 : this.summary.total - balance) * 100) / 100;
    // const charge = { ...this.summary, ...{ payable }, ...{ balance } };
    // const merchant = this.state.merchant;


    this.route.params.pipe(takeUntil(this.onDestroy$)).subscribe(params => {
      const merchantId = params['id'];

      this.componentDidMount(merchantId).then((r: any) => {
        this.products = r.products;
        this.merchant = r.merchant;
        const items = r.products.map(p => {
          return { product: p, quantity: 0 };
        });
        this.items = this.mergeCart(this.cart, items);
      });
    });

    this.accountSvc.getCurrentAccount().pipe(takeUntil(this.onDestroy$)).subscribe(r => {
      this.account = r.data;
    });
  }

  // mergeQuantityFromCart(groups, cart) {
  //   groups.map(group => {
  //     group.items.map(groupItem => {
  //       const cartItem: ICartItem = cart.items.find(item => item.productId === groupItem.product._id);
  //       groupItem.quantity = cartItem ? cartItem.quantity : 0;
  //     });
  //   });
  //   return groups;
  // }

  ngOnDestroy() {
    this.locationSubscription.unsubscribe();
    this.onDestroy$.next();
    this.onDestroy$.complete();
  }

  openQuitMerchantDialog(merchantId: string): void {
    const self = this;
    this.dialogRef = this.dialog.open(QuitMerchantDialogComponent, {
      width: '300px',
      data: { merchantId },
      closeOnNavigation: true
    });

    this.dialogRef.afterClosed().pipe(takeUntil(this.onDestroy$)).subscribe((r: any) => {
      this.action = r.action;
      if (r.action === 'leave') {
        // pass
      } else if (r.action === 'stay') {
        // pass
      }
    });
  }

  onAfterCheckout(e) {

  }

  onNext() {
    // set up prepay method
    const account = this.account;
    const amount = this.cartSvc.getTotal(this.cart);
    const balance = Math.round((account && account.balance ? account.balance : 0) * 100) / 100;
    const paymentMethod = ((amount !== 0) && (balance >= amount)) ? PaymentMethod.PREPAY : PaymentMethod.WECHAT;
    this.rx.dispatch({ type: PaymentActions.UPDATE_PAYMENT_METHOD, payload: { paymentMethod } });
    this.router.navigate(['order/form/' + OrderFormAction.NEW]);
  }

  componentDidMount(merchantId) {
    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve, reject) => {
      this.merchantSvc.getById(merchantId).then(merchant => {
        // ['_id', 'name', 'description', 'price', 'pictures', 'order']
        this.productSvc.quickFind({ merchantId, status: ProductStatus.ACTIVE }).then((r: any) => {
          if (r.code === 'success') {
            const products = r.data.sort((a: any, b: any) => {
              return a.order > b.order ? 1 : -1;
            });

            resolve({ merchant, products });
          } else {
            resolve({ merchant, prodcuts:[]});
          } 
          



        });
      });
    });
  }

  // merge quantity in card into product
  mergeCart(cart, currItems) {
    if (cart && cart.length > 0) {
      cart.map((it: any) => {
        let quantity = 0;
        it.deliveries.map(d => quantity += (d.quantity ? d.quantity : 0));

        currItems.map(ci => {
          if (it.product._id === ci.product._id) {
            ci.quantity = quantity;
          }
        });
      });
      return currItems;
    } else {
      return currItems.map(ci => {
        return { product: ci.product, quantity: 0 };
      });
    }
  }


  onSelectShoppingItem(item) {
    const addressHint = this.lang === 'en' ? 'Please enter delivery address' : '请先输入送货地址';
    if (!this.bHasAddress) {
      alert(addressHint);
      this.router.navigate(['/']); // routing issue
      return;
    } else {
      // this.selected = p;
      this.router.navigate(['cart/delivery/' + item.product._id]);
    }
  }
}
