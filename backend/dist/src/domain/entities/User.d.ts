type UserProps = {
    id?: string;
    name: string;
    email: string;
    password: string;
    role?: "MASTER" | "USER" | "EDITOR";
};
export declare class User {
    id?: string | undefined;
    name: string;
    readonly email: string;
    readonly password: string;
    role: string;
    constructor(props: UserProps);
}
export {};
//# sourceMappingURL=User.d.ts.map