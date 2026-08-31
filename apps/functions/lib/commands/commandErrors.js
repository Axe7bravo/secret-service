import { HttpsError } from 'firebase-functions/v2/https';
export const asCallableError = (error) => {
    if (error instanceof HttpsError)
        return error;
    if (error instanceof Error && error.message.startsWith('Transition '))
        return new HttpsError('failed-precondition', 'The operation state changed or this action is no longer available.');
    if (error instanceof Error && ['A reason is required.', 'An ambassador is required.', 'Delivery details review must be confirmed.'].includes(error.message))
        return new HttpsError('invalid-argument', error.message);
    return new HttpsError('internal', 'The operation command could not be completed.');
};
