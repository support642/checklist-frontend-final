import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Settings, Menu, X, LogOut, User } from 'lucide-react';
import clsx from 'clsx';
import Footer from './Footer';

const Layout = ({ children }) => {
    const user = {
        name: localStorage.getItem('user-name') || 'User',
        role: localStorage.getItem('role') || 'user'
    };
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("user-name");
        localStorage.removeItem("role");
        localStorage.removeItem("email_id");
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'All Products', icon: Package, path: '/products' },
        { name: 'Settings', icon: Settings, path: '/settings' },
    ];

    return (
        <div className="flex bg-slate-50 h-screen supports-[height:100dvh]:h-[100dvh] w-full overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-sky-100 flex flex-col transition-transform duration-200 ease-in-out",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="p-6 border-b border-sky-100 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-sky-800">Asset Management System</h1>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-500">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <ul className="space-y-1 px-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className={clsx(
                                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-sky-50 text-sky-700"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                        onClick={() => setIsSidebarOpen(false)}
                                    >
                                        <Icon size={20} />
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-sky-100">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
                            <User size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                            <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white border-b border-sky-100 p-4 flex items-center justify-between">
                    <h1 className="text-lg font-bold text-slate-800">
                        {navItems.find(i => i.path === location.pathname)?.name || 'Asset Management System'}
                    </h1>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-md"
                    >
                        <Menu size={24} />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto bg-slate-50 w-full flex flex-col items-stretch">
                    {children}
                    <div className="mt-auto">
                        <Footer />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
