import { defineSecret, defineString } from 'firebase-functions/params';
export const yocoSecretKey = defineSecret('YOCO_SECRET_KEY');
export const yocoWebhookSecret = defineSecret('YOCO_WEBHOOK_SECRET');
export const customerAppUrl = defineString('CUSTOMER_APP_URL');
