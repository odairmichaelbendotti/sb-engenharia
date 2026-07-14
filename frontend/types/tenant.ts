export interface Tenant {
  id: string;
  name: string;
  apelido: string;
  cnpj: string;
  cep: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantOption {
  id: string;
  name: string;
}
