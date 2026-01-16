export enum UserAdminRole {
    ADMIN = "ADMIN",
}

export enum UserClientRole {
    CUSTOMER = "CUSTOMER",
    DRIVER = "DRIVER",
}

export type UserRole = UserAdminRole | UserClientRole;

export type User = {
    uid: string
    email: string
    firstName: string
    lastName: string
    role: UserRole
}
