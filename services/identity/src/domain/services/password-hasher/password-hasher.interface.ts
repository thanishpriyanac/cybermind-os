export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, plainText: string): Promise<boolean>;
}
