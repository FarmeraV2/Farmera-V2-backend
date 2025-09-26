import { UserRole } from "src/common/enums/role.enum";
import { UserStatus } from "src/modules/user/enums/user-status.enum";

export interface UserInterface {
    id: number;
    uuid: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role: UserRole;
    status: UserStatus;
    farm_id?: number;
    farm_uuid?: number;
    avatar?: string;
    sub?: string; // JWT subject field
    iat?: number; // JWT issued at timestamp
    exp?: number; // JWT expiration timestamp
}