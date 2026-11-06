import { createContext, useCallback, useContext, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useStrings } from '@/core/i18n';

import { TOUCH, createStyles, fonts, radius, spacing, stroke, useColors } from '../theme';

type ConfirmFn = (title: string, message?: string, destructive?: boolean) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(false));

/**
 * In-app confirmation dialog. Alert.alert is not implemented on react-native-web,
 * so a Modal keeps the behaviour identical on web, iOS and Android.
 */
export function ConfirmProvider({ children }: PropsWithChildren) {
  const t = useStrings();
  const c = useColors();
  const styles = useStyles();
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
  // Red carries "this cannot be undone" here, the way the guide's danger popup does.
  const accent = state?.destructive ? c.red : c.primary;

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal visible={state !== null} transparent animationType="fade" onRequestClose={() => finish(false)}>
        <View style={styles.backdrop}>
          <View style={styles.box}>
            <Text style={styles.title}>{state?.title}</Text>
            {state?.message ? <Text style={styles.message}>{state.message}</Text> : null}
            <View style={styles.actions}>
              <Pressable style={[styles.action, { borderColor: c.border }]} onPress={() => finish(false)}>
                <Text style={[styles.actionText, { color: c.textSecondary }]}>{t.common.cancel}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.action,
                  { borderColor: accent, backgroundColor: pressed ? accent : c.background },
                ]}
                onPress={() => finish(true)}
              >
                {({ pressed }) => (
                  <Text style={[styles.actionText, { color: pressed ? c.onAccent : accent }]}>{t.common.yes}</Text>
                )}
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

const useStyles = createStyles((c) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    box: {
      width: 320,
      maxWidth: '100%',
      backgroundColor: c.background,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.popup,
      paddingTop: spacing.xxl,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
    },
    title: { ...fonts.heading, color: c.heading, textAlign: 'center' },
    message: { ...fonts.footnote, color: c.textSecondary, textAlign: 'center', paddingTop: spacing.sm },
    actions: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center', marginTop: spacing.xl },
    action: {
      flex: 1,
      minHeight: TOUCH,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: stroke.control,
      borderRadius: radius.control,
    },
    actionText: { ...fonts.body, fontWeight: '600' },
  }),
);
