import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
    children,
    className = '',
    hover = false,
    ...props
}) => {
    return (
        <motion.div
            initial={hover ? { opacity: 0, y: 20 } : undefined}
            animate={{ opacity: 1, y: 0 }}
            whileHover={hover ? { y: -5, boxShadow: '0 0 25px rgba(124, 58, 237, 0.2)' } : undefined}
            className={`
        bg-dark-surface/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6
        ${className}
      `}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export default Card;
