import { db } from "@/db/client";
import migrations from "@/drizzle/migrations";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import React, { createContext, useContext } from "react";

interface DatabaseContextType {
    isReady: boolean;
    error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextType>({
    isReady: false,
    error: null,
});

export function useDatabaseReady() {
    return useContext(DatabaseContext);
}

interface DatabaseProviderProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function DatabaseProvider({ children, fallback }: DatabaseProviderProps) {
    const { success, error } = useMigrations(db, migrations);

    if (error) {
        console.error("Database migration error:", error);
        // 可以在这里显示错误 UI
        return fallback ?? null;
    }

    if (!success) {
        // 可以在这里显示加载 UI
        return fallback ?? null;
    }

    return (
        <DatabaseContext.Provider value={{ isReady: success, error: error ?? null }}>
            {children}
        </DatabaseContext.Provider>
    );
}
