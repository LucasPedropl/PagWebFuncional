import type { NotificationSettings } from '../../types';

const STORAGE_KEY_PREFIX = 'pagweb:notification-defaults-applied:';

export const ALL_NOTIFICATION_CHANNELS_ENABLED: NotificationSettings = {
  notificacoes: true,
  email: true,
  whatsApp: true,
  sms: true,
};

export function parseNotificationSettings(payload: unknown): NotificationSettings {
  if (!payload || typeof payload !== 'object') {
    return { ...ALL_NOTIFICATION_CHANNELS_ENABLED };
  }

  const record = payload as Record<string, unknown>;
  return {
    notificacoes: readBoolean(record, 'notificacoes', 'Notificacoes') ?? true,
    email: readBoolean(record, 'email', 'Email') ?? true,
    whatsApp: readBoolean(record, 'whatsApp', 'WhatsApp') ?? true,
    sms: readBoolean(record, 'sms', 'Sms') ?? true,
  };
}

export function areAllNotificationChannelsDisabled(settings: NotificationSettings): boolean {
  return !settings.notificacoes && !settings.email && !settings.whatsApp && !settings.sms;
}

export function hasAppliedNotificationChannelDefaults(ownerKey: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${ownerKey}`) === '1';
  } catch {
    return false;
  }
}

export function markNotificationChannelDefaultsApplied(ownerKey: string): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${ownerKey}`, '1');
  } catch {
    // quota / private mode
  }
}

/**
 * A API cria a linha com bools C# em false. Isso não é escolha do usuário —
 * é ausência de default. Persistimos tudo ligado uma vez; se depois ele
 * desligar os quatro canais, o flag impede de religar.
 */
export async function resolveNotificationSettingsWithApiDefault(
  loaded: NotificationSettings,
  persistAllEnabled: () => Promise<void>,
  ownerKey: string,
): Promise<NotificationSettings> {
  if (!areAllNotificationChannelsDisabled(loaded)) {
    return loaded;
  }
  if (hasAppliedNotificationChannelDefaults(ownerKey)) {
    return loaded;
  }

  try {
    await persistAllEnabled();
    markNotificationChannelDefaultsApplied(ownerKey);
    return { ...ALL_NOTIFICATION_CHANNELS_ENABLED };
  } catch {
    return { ...ALL_NOTIFICATION_CHANNELS_ENABLED };
  }
}

function readBoolean(
  record: Record<string, unknown>,
  camel: string,
  pascal: string,
): boolean | undefined {
  const value = record[camel] ?? record[pascal];
  return typeof value === 'boolean' ? value : undefined;
}
