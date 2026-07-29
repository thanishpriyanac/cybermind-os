import * as argon2 from 'argon2';
import { Injectable } from '@nestjs/common';
import { IPasswordHasher } from './password-hasher.interface';

@Injectable()
export class Argon2PasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  async verify(hash: string, plainText: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plainText);
    } catch (e) {
      return false;
    }
  }
}
