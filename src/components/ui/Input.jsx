import React from 'react';

/**
 * Input component — Neo-Glass Elite
 */
const Input = React.forwardRef(({
  className = '',
  style = {},
  ...props
}, ref) => (
  <input
    ref={ref}
    className={`input ${className}`}
    style={style}
    {...props}
  />
));

Input.displayName = 'Input';

export default Input;
