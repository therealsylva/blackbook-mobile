import {useRef, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';
import {AccountPrompt} from '@/components/account/account-prompt';
import {Screen} from '@/components/ui/screen';
import {TopBar} from '@/components/ui/top-bar';
import {useAuth} from '@/context/auth-context';
import {useExchange} from '@/context/exchange-context';
import {uuid} from '@/lib/backend';
import {activeDegenPlan, degenErrorMessage, degenNames, type DegenPlanId} from '@/lib/degen';
import {useTheme} from '@/theme/theme-context';
import {radii, spacing, typography} from '@/theme/tokens';

export default function DegenScreen() {
  const {session} = useAuth();
  const {colors} = useTheme();
  const {degen, degenLoadError, refreshDegen, changeDegen} = useExchange();
  const [pending, setPending] = useState<DegenPlanId | 'stop_renewal' | null>(null);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const retry = useRef<{plan: DegenPlanId; id: string} | null>(null);
  const active = activeDegenPlan(degen);

  if (!session) return <AccountPrompt title="Degen" description="Sign in to manage your subscription." />;

  async function change(plan?: DegenPlanId) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(plan ?? 'stop_renewal');
    setError('');
    try {
      if (plan) {
        if (retry.current?.plan !== plan) retry.current = {plan, id: uuid()};
        await changeDegen({action:'subscribe', plan, requestId:retry.current.id});
      } else {
        await changeDegen({action:'stop_renewal'});
      }
      retry.current = null;
    } catch (reason) {
      setError(degenErrorMessage(reason));
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  }

  return <Screen edges={['top', 'bottom']}>
    <TopBar title="Degen" back />
    <ScrollView contentContainerStyle={{padding:spacing.page, gap:spacing.md}}>
      <Text style={{color:colors.textMuted, fontFamily:typography.family, lineHeight:20}}>
        Paid subscriptions renew monthly from your available live BlackBook balance.
      </Text>
      {error ? <Text accessibilityRole="alert" style={{color:colors.negative}}>{error}</Text> : null}
      {degenLoadError && !degen
        ? <Pressable accessibilityRole="button" onPress={() => void refreshDegen()}>
            <Text style={{color:colors.text}}>Unable to load plans. Tap to retry.</Text>
          </Pressable>
        : !degen ? <ActivityIndicator color={colors.text} accessibilityLabel="Loading Degen plans" /> : null}
      {active && active.id !== 'free' && degen?.paidUntil ?
        <Text accessibilityLiveRegion="polite" style={{color:colors.positive}}>
          Paid through {new Date(degen.paidUntil).toLocaleDateString()}
        </Text> : null}
      {degen?.plans.map(plan => {
        const isActive = active?.id === plan.id;
        const disabled = Boolean(pending) || isActive || !plan.available || active?.id !== 'free';
        return <View key={plan.id} style={{backgroundColor:colors.section, borderRadius:radii.md, padding:spacing.md, gap:spacing.sm}}>
          <Text style={{color:colors.text, fontFamily:typography.semibold, fontSize:18}}>{degenNames[plan.id]}</Text>
          <Text style={{color:colors.textMuted}}>Up to {plan.mobileLeverage.toLocaleString()}× mobile leverage · ${plan.priceMinor / 100}/month</Text>
          {isActive
            ? <Text accessibilityLiveRegion="polite" style={{color:plan.id === 'free' ? colors.textMuted : colors.positive}}>{plan.id === 'free' ? 'Current plan' : 'Paid · Active'}</Text>
            : plan.id !== 'free' ? <Pressable
                accessibilityRole="button" accessibilityState={{disabled, busy:pending === plan.id}}
                disabled={disabled} onPress={() => void change(plan.id)}
                style={{backgroundColor:colors.control, borderRadius:radii.md, padding:spacing.sm, opacity:disabled ? 0.6 : 1}}>
                <Text style={{color:colors.text, fontFamily:typography.semibold}}>
                  {pending === plan.id ? 'Paying…' : plan.available ? `Pay $${plan.priceMinor / 100}` : 'Unavailable'}
                </Text>
              </Pressable> : null}
        </View>;
      })}
      {active && active.id !== 'free' && degen?.autoRenew ? <Pressable
        accessibilityRole="button" accessibilityState={{disabled:Boolean(pending), busy:pending === 'stop_renewal'}}
        disabled={Boolean(pending)} onPress={() => void change()}
        style={{backgroundColor:colors.control, padding:spacing.md, borderRadius:radii.md}}>
        <Text style={{color:colors.text}}>{pending === 'stop_renewal' ? 'Updating…' : 'Turn off auto-renew'}</Text>
      </Pressable> : null}
    </ScrollView>
  </Screen>;
}
