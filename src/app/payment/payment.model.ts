export const AppType = {
  FOOD_DELIVERY: 'F',
  GROCERY: 'G',
  FRESH: 'F',
  TELECOM: 'T'
};


export const PaymentError = {
  NONE: 'N',
  PHONE_EMPTY: 'PE',
  LOCATION_EMPTY: 'LE',
  DUPLICATED_SUBMIT: 'DS',
  CART_EMPTY: 'CE',
  BANK_CARD_EMPTY: 'BE',
  INVALID_BANK_CARD: 'IB',
  BANK_CARD_FAIL: 'BF',
  WECHATPAY_FAIL: 'WF',
  CREATE_BANK_CUSTOMER_FAIL: 'CBCF',
  BANK_INSUFFICIENT_FUND: 'BIF',
  BANK_CARD_DECLIEND: 'BCD',
  INVALID_ACCOUNT: 'IA',
  BANK_AUTHENTICATION_REQUIRED: 'BAR'
};

export const PaymentMethod = {
  CASH: 'CA',
  WECHAT: 'W',
  CREDIT_CARD: 'CC',
  PREPAY: 'P'
};

export const PaymentStatus = {
  UNPAID: 'U',
  PAID: 'P'
};
