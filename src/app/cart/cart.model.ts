
export interface ICartItem {
  productId: string;
  productName: string; // product name
  merchantId: string;
  merchantName: string;
  price: number;
  cost: number;
  quantity: number;
}

export interface ICart {
  clientId?: string;
  clientName?: string;
  clientPhoneNumber?: string;
  merchantId: string;
  merchantName?: string;
  price?: number;
  quantity?: number;
  items: ICartItem[];
}
