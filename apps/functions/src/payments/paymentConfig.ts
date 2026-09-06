import { defineSecret, defineString } from 'firebase-functions/params';

export const yocoSecretKey: ReturnType<typeof defineSecret> = defineSecret('YOCO_SECRET_KEY');
export const yocoWebhookSecret: ReturnType<typeof defineSecret> = defineSecret('YOCO_WEBHOOK_SECRET');
export const customerAppUrl: ReturnType<typeof defineString> = defineString('CUSTOMER_APP_URL');
