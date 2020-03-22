import { PageActions, AppStateActions} from './main.actions';


export interface IAction {
  type: string;
  payload: any;
}

export const AppState = {
  NOT_READY: 'N',
  READY: 'R'
};

export function appStateReducer(state: string = AppState.NOT_READY, action: IAction) {
  if (action.payload) {
    switch (action.type) {
      case AppStateActions.UPDATE_APP_STATE:
      return action.payload;
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


