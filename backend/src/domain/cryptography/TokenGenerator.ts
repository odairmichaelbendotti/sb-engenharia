export interface ITokenGenerator {
  generate(payload: object): string;
}
