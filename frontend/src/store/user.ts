import { create } from "zustand";
import type { User } from "../../types/user";

type UserStore = {
  user: User | null;
};

const mockUser: User = {
  id: "1",
  name: "Odair Michael",
  email: "obendotti@gmail.com",
  role: "MASTER",
};

export const useUser = create<UserStore>(() => ({
  user: mockUser,
}));
