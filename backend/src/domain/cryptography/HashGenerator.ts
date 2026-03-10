export interface IHashGenerator {
  generate(password: string): Promise<string>;
}
