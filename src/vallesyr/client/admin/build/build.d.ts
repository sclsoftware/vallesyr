declare namespace vallesyr {
    interface Sync {
        id?: number;
        idTerminal: number;
        terminalName?: string;
        idUpdate: number;
        updateId?: string;
        idCreateUser?: number;
        createUserName?: string;
        createDate?: number | Date;
        deleted?: boolean;
    }
    interface UserUpdate {
        id?: number;
        idWorker: number;
        workerName?: string;
        idCreateUser?: number;
        createUserName?: string;
        createDate?: number | Date;
        deleted?: boolean;
    }
}
declare namespace vallesyr {
}
