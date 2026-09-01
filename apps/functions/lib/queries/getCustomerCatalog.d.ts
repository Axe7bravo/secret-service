export declare const getCustomerCatalog: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    packages: {
        packageId: string;
        code: string;
        name: string;
        description: string;
        priceMinor: number;
        currency: "ZAR";
        displayOrder: number;
    }[];
    campuses: {
        campusId: string;
        code: string;
        name: string;
        city: string;
        displayOrder: number;
    }[];
    settings: {
        operationCreationEnabled: boolean;
        minimumLeadTimeDays: number;
        maximumFutureDays: number;
        deliveryWindows: string[];
        availabilityMessage: string;
    };
}>, unknown>;
//# sourceMappingURL=getCustomerCatalog.d.ts.map