import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useStrings } from '@/core/i18n';

import { colors, fonts, radius, shadow, spacing } from '../theme';

type ConfirmFn = (title: string, message?: string, destructive?: boolean) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));

/**
 * In-app confirmation dialog. Alert.alert is not implemented on react-native-web,
 * so a Modal keeps the behaviour identical on web, iOS and Android.
 */
export function ConfirmProvider({ children }: PropsWithChildren) {
  const t = useStrings();
  const [state, setState] = useState<{ title: string; message?: string; destructive?: boolean } | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((title, message, destructive) => {
    setState({ title, message, destructive });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const finish = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setState(null);
  };

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal visible={state !== null} transparent animationType="fade" onRequestClose={() => finish(false)}>
        <View style={styles.backdrop}>
          <View style={styles.box}>
            <Text style={styles.title}>{state?.title}</Text>
            {state?.message ? <Text style={styles.message}>{state.message}</Text> : null}
            <View style={styles.actions}>
              <Pressable style={styles.action} onPress={() => finish(false)}>
                <Text style={[styles.actionText, { color: colors.primary }]}>{t.common.cancel}</Text>
              </Pressable>
              <View style={styles.actionDivider} />
              <Pressable style={styles.action} onPress={() => finish(true)}>
                <Text style={[styles.actionText, { color: state?.destructive ? colors.red : colors.primary, fontWeight: '600' }]}>
                  {t.common.yes}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext);
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  box: { width: 280, backgroundColor: colors.background, borderRadius: radius.xl, overflow: 'hidden', ...shadow.card },
  title: { ...fonts.body, fontWeight: '600', textAlign: 'center', paddingTop: spacing.lg, paddingHorizontal: spacing.lg },
  message: { ...fonts.footnote, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  actions: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.separator, marginTop: spacing.lg },
  action: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  actionDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.separator },
  actionText: { ...fonts.body },
});
