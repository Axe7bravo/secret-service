interface CreateOperationInput {
    customerId: string;
    package: {
        packageId: string;
        name: string;
        priceMinor: number;
    };
    recipient: {
        name: string;
        phone: string;
        campus: string;
        residence: string;
        deliveryLocation: string;
        deliveryInstructions?: string;
    };
    delivery: {
        requestedDate: string;
        requestedWindow: string;
    };
    anonymousMessage: string;
}
export declare const createOperation: import("firebase-functions/v2/https").CallableFunction<CreateOperationInput, any, unknown>;
export {};
//# sourceMappingURL=createOperation.d.ts.map