export declare const getCustomerCatalog: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    packages: import("./activePackageCatalog.js").CatalogPackage[];
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