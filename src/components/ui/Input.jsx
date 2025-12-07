import React from 'react';

const Input = ({
    label,
    type = 'text',
    className = '',
    error,
    ...props
}) => {
    return (
        <div className="relative w-full">
            <input
                type={type}
                className={`
          peer w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pt-6
          text-white placeholder-transparent outline-none transition-all
          focus:border-primary/50 focus:ring-4 focus:ring-primary/10
          disabled:opacity-50
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}
          ${className}
        `}
                placeholder={label}
                {...props}
            />
            {label && (
                <label className={`
          absolute left-4 top-1 text-xs text-gray-400 transition-all
          peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3.5
          peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary-light
          pointer-events-none
        `}>
                    {label}
                </label>
            )}
            {error && (
                <span className="text-xs text-red-500 mt-1 ml-1">{error}</span>
            )}
        </div>
    );
};

export default Input;
