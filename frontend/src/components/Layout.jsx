import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";

export default function Layout() {
    return (
        <div className="min-h-screen flex bg-[var(--ttm-bg)] text-[var(--ttm-text)]">
            <Sidebar />
            <main className="flex-1 md:pt-0 pt-14 overflow-x-hidden">
                <Outlet />
            </main>
        </div>
    );
}
