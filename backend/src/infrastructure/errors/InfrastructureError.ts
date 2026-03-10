export class InfrastructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InfrastructureError";
  }
}
