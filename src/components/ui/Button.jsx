import React from 'react';
import { motion } from 'framer-motion';

const variants = {
    primary: 'bg-gradient-to-r from-primary to-primary-light hover:from-primary-hover hover:to-primary text-white shadow-lg shadow-primary/25',
    secondary: 'bg-secondary hover:bg-secondary-hover text-white shadow-lg shadow-secondary/25',
    outline: 'border-2 border-primary/20 text-primary-light hover:border-primary/50 hover:bg-primary/5',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25',
};

const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    icon: 'p-3',
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    ...props
}) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
        relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
            disabled={loading}
            {...props}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : null}
            {children}
        </motion.button>
    );
};

export default Button;
