type ComparerProps = {
  password: string;
  hash: string;
};

export interface IHashComparer {
  compare({ password, hash }: ComparerProps): Promise<boolean>;
}
