import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserMenuProps {
    onNavigate: (view: 'history' | 'certificates' | 'stats') => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onNavigate }) => {
    const { user, signOut, loading } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
    const avatarUrl = user.user_metadata?.avatar_url;

    const handleSignOut = async () => {
        setIsOpen(false);
        await signOut();
    };

    const menuItems = [
        {
            id: 'history',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            label: 'Histórico',
            description: 'Vídeos assistidos'
        },
        {
            id: 'certificates',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
            ),
            label: 'Certificados',
            description: 'Suas conquistas'
        },
        {
            id: 'stats',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            label: 'Estatísticas',
            description: 'Seu progresso'
        }
    ];

    return (
        <div ref={menuRef} className="relative">
            {/* Avatar Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-all duration-200"
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={userName}
                        className="w-8 h-8 rounded-full ring-2 ring-blue-500/50"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                )}
                <span className="text-white font-medium text-sm hidden md:block max-w-[120px] truncate">
                    {userName}
                </span>
                <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-slate-700/50">
                        <div className="flex items-center gap-3">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={userName}
                                    className="w-12 h-12 rounded-full ring-2 ring-blue-500/50"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold truncate">{userName}</p>
                                <p className="text-slate-400 text-sm truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setIsOpen(false);
                                    onNavigate(item.id as 'history' | 'certificates' | 'stats');
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-slate-800/50 transition-colors duration-150 group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300 transition-colors">
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="text-white font-medium">{item.label}</p>
                                    <p className="text-slate-500 text-xs">{item.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-700/50 mx-4" />

                    {/* Logout Button */}
                    <div className="p-2">
                        <button
                            onClick={handleSignOut}
                            disabled={loading}
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-red-500/10 transition-colors duration-150 group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-red-500/20 group-hover:text-red-400 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-slate-300 font-medium group-hover:text-red-400 transition-colors">Sair</p>
                                <p className="text-slate-500 text-xs">Encerrar sessão</p>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
