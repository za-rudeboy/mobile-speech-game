import { StyleSheet, Text, type TextProps } from 'react-native';

import { AppFonts, childTheme, parentTheme } from '@/constants/semantic-theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  role?:
    | 'default'
    | 'title'
    | 'defaultSemiBold'
    | 'subtitle'
    | 'link'
    | 'childDisplay'
    | 'childTitle'
    | 'childBody'
    | 'childLabel'
    | 'childButton'
    | 'parentTitle'
    | 'parentBody'
    | 'parentLabel'
    | 'parentButton';
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  role,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const resolvedRole = role ?? type;

  return (
    <Text
      style={[
        { color },
        resolvedRole === 'default' ? styles.default : undefined,
        resolvedRole === 'title' ? styles.title : undefined,
        resolvedRole === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        resolvedRole === 'subtitle' ? styles.subtitle : undefined,
        resolvedRole === 'link' ? styles.link : undefined,
        resolvedRole === 'childDisplay' ? styles.childDisplay : undefined,
        resolvedRole === 'childTitle' ? styles.childTitle : undefined,
        resolvedRole === 'childBody' ? styles.childBody : undefined,
        resolvedRole === 'childLabel' ? styles.childLabel : undefined,
        resolvedRole === 'childButton' ? styles.childButton : undefined,
        resolvedRole === 'parentTitle' ? styles.parentTitle : undefined,
        resolvedRole === 'parentBody' ? styles.parentBody : undefined,
        resolvedRole === 'parentLabel' ? styles.parentLabel : undefined,
        resolvedRole === 'parentButton' ? styles.parentButton : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: AppFonts.body,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: AppFonts.bodySemiBold,
  },
  title: {
    fontSize: 32,
    fontFamily: AppFonts.heading,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: AppFonts.headingSemiBold,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
    fontFamily: AppFonts.bodySemiBold,
  },
  childDisplay: {
    fontFamily: AppFonts.heading,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
    color: childTheme.text,
  },
  childTitle: {
    fontFamily: AppFonts.headingSemiBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.4,
    color: childTheme.text,
  },
  childBody: {
    fontFamily: AppFonts.body,
    fontSize: 20,
    lineHeight: 30,
    color: childTheme.text,
  },
  childLabel: {
    fontFamily: AppFonts.bodySemiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.3,
    color: childTheme.textMuted,
  },
  childButton: {
    fontFamily: AppFonts.bodySemiBold,
    fontSize: 20,
    lineHeight: 24,
  },
  parentTitle: {
    fontFamily: AppFonts.headingSemiBold,
    fontSize: 28,
    lineHeight: 34,
    color: parentTheme.text,
  },
  parentBody: {
    fontFamily: AppFonts.body,
    fontSize: 17,
    lineHeight: 24,
    color: parentTheme.text,
  },
  parentLabel: {
    fontFamily: AppFonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: parentTheme.textMuted,
  },
  parentButton: {
    fontFamily: AppFonts.bodySemiBold,
    fontSize: 18,
    lineHeight: 22,
  },
});
