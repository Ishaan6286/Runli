import React from 'react';

const Footer = () => {
    return (
        <footer className="w-full bg-dark-surface border-t border-white/5 py-12 mt-20">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                        R
                    </div>
                    <span className="text-xl font-bold text-white">Runli</span>
                </div>

                <p className="text-gray-400 text-sm mb-6">
                    Empowering your fitness journey, one day at a time.
                </p>

                <div className="flex justify-center gap-6 text-sm text-gray-500">
                    <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-primary transition-colors">Contact</a>
                </div>

                <div className="mt-8 text-xs text-gray-600">
                    © {new Date().getFullYear()} Runli Inc. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
