import React from 'react';

/**
 * Button component — Neo-Glass Elite
 * 
 * @param {string} variant - 'primary' | 'secondary' | 'ghost' | 'icon' | 'fab'
 * @param {string} size    - 'sm' | 'md' | 'lg'
 * @param {node}   children
 */
const sizeMap = {
  sm: { padding: '0.45rem 0.875rem', fontSize: '0.75rem' },
  md: { padding: '0.6875rem 1.25rem', fontSize: '0.8125rem' },
  lg: { padding: '0.875rem 1.75rem', fontSize: '0.9375rem' },
};

const Button = React.forwardRef(({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  style = {},
  ...props
}, ref) => {
  const sizeStyle = variant !== 'icon' && variant !== 'fab' ? sizeMap[size] : {};

  return (
    <button
      ref={ref}
      className={`btn btn-${variant} ${className}`}
      style={{ ...sizeStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
export const PrimaryButton   = (p) => <Button variant="primary"   {...p} />;
export const SecondaryButton = (p) => <Button variant="secondary" {...p} />;
export const GhostButton     = (p) => <Button variant="ghost"     {...p} />;
export const IconButton      = (p) => <Button variant="icon"      {...p} />;
export const FAB             = (p) => <Button variant="fab"       {...p} />;
