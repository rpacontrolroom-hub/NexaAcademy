export type UserRole = "Usuário" | "Administrador";
export type UserStatus = "ativo" | "inativo";

export interface User {
  name: string;
  email: string;
  perfil: UserRole;
  status: UserStatus;
  acesso: string;
}

export interface Profile {
  name: string;
  role: string;
}
