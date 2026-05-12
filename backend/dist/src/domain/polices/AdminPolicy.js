export class AdminPolicy {
    isAdmin(user) {
        if (user.role === "USER") {
            return false;
        }
        return true;
    }
}
//# sourceMappingURL=AdminPolicy.js.map