import { PageActions, AppStateActions } from './main.actions';
import { DEFAULT_CART } from '../cart/cart.reducer';


export interface IAction {
  type: string;
  payload: any;
}

export const AppState = {
  NOT_READY: 'N',
  READY: 'R'
};
export interface IApp {
  state: string;
  code: string;
}

export const DEFAULT_APP = {
  state: AppState.NOT_READY,
  code: ''
};

export function appStateReducer(state = DEFAULT_APP, action: IAction) {
  if (action.payload) {
    switch (action.type) {
      case AppStateActions.UPDATE_APP_STATE:
        return { ...state, state: action.payload};
      case AppStateActions.UPDATE_APP_CODE:
        return { ...state, code: action.payload};
    }
  }
  return state;
}


export function pageReducer(state: string = 'home', action: IAction) {
  if (action.payload) {
    switch (action.type) {
      case PageActions.UPDATE_URL:
        return action.payload;
    }
  }

  return state;
}


