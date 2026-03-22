import React from 'react';

/**
 * Card component — Neo-Glass Elite
 *
 * @param {string} variant - 'base' | 'glass' | 'featured' | 'stat'
 */
const variantClass = {
  base:     'card',
  glass:    'card-glass',
  featured: 'card-featured',
  stat:     'card-stat',
};

const Card = React.forwardRef(({
  variant = 'base',
  children,
  className = '',
  style = {},
  ...props
}, ref) => (
  <div
    ref={ref}
    className={`${variantClass[variant] || 'card'} ${className}`}
    style={style}
    {...props}
  >
    {children}
  </div>
));

Card.displayName = 'Card';

export default Card;
export const GlassCard    = (p) => <Card variant="glass"    {...p} />;
export const FeaturedCard = (p) => <Card variant="featured" {...p} />;
export const StatCard     = (p) => <Card variant="stat"     {...p} />;
