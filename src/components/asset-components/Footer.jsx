import React from 'react';
import { Heart } from 'lucide-react';

const Footer = ({ className = "" }) => {
    return (
        <footer className={`py-6 text-center text-sm text-slate-500 border-t border-slate-100 mt-auto w-full ${className}`}>
            <p className="flex items-center justify-center gap-1.5 flex-wrap">
                <span>Powered By</span>
                <a
                    href="https://www.botivate.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-purple-600 hover:text-purple-700 hover:underline transition-colors flex items-center gap-1"
                >
                    Botivate
                </a>
            </p>
        </footer>
    );
};

export default Footer;
