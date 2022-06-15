import * as argon2 from 'argon2';
import { IUser } from '../../config/types';
import { readJsonFile, writeFile } from '../fs/fs.helpers';
import AuthHelpers from './auth.helpers';

const login = async (email: string, password: string) => {
  const user = AuthHelpers.getUser(email);

  if (!user) {
    throw new Error('User not found');
  }

  return AuthHelpers.getJwtToken(user, password);
};

const register = async (email: string, password: string, name: string) => {
  const users: IUser[] = readJsonFile('/state/users.json');

  if (users.length > 0) {
    throw new Error('There is already an admin user');
  }

  if (!email || !password) {
    throw new Error('Missing email or password');
  }

  const hash = await argon2.hash(password);
  const newuser: IUser = { email, name, password: hash };

  const token = await AuthHelpers.getJwtToken(newuser, password);

  writeFile('/state/users.json', JSON.stringify([newuser]));

  return token;
};

const AuthService = {
  login,
  register,
};

export default AuthService;
