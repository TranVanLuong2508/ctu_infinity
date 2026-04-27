import { IUser } from './user.type';

export type LoginInput = {
  email: string;
  password: string;
};

export interface IAccount {
  access_token: string;
  user: IUser;
}

export interface IGetAccount {
  user: IUser;
}
