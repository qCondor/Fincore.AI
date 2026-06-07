import React from 'react';
import { Text, TextProps } from 'react-native';
import { useSecurity } from '../contexts/SecurityContext';

interface MaskedTextProps extends TextProps {
  children: React.ReactNode;
  sensitive?: boolean;
}

export function MaskedText({ children, sensitive = true, style, ...props }: MaskedTextProps) {
  const { prefs } = useSecurity();

  if (sensitive && prefs.hideBalances) {
    const text = typeof children === 'string' ? children : String(children);
    const masked = text.replace(/[\d.,]+/g, '••••');
    return <Text style={style} {...props}>{masked}</Text>;
  }

  return <Text style={style} {...props}>{children}</Text>;
}

export function MaskedAmount({ amount, style, ...props }: { amount: string | number } & TextProps) {
  const { prefs } = useSecurity();

  if (prefs.hideBalances) {
    return <Text style={style} {...props}>••••</Text>;
  }

  const formatted = typeof amount === 'number' ? `£${amount.toFixed(2)}` : amount;
  return <Text style={style} {...props}>{formatted}</Text>;
}
