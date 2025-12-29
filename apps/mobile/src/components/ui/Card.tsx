import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
}

export function Card({
  children,
  variant = 'default',
  className = '',
  ...props
}: CardProps) {
  const baseStyles = 'rounded-xl';

  const variantStyles = {
    default: 'bg-slate-800',
    elevated: 'bg-slate-800 shadow-lg shadow-black/20',
    outlined: 'bg-transparent border border-slate-700',
  };

  return (
    <View
      className={`${baseStyles} ${variantStyles[variant]} p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
