export declare const packageIdPattern: RegExp;
export declare const imageIdPattern: RegExp;
export interface PackageImage {
    id: string;
    path: string;
    generation: string;
}
export declare function packageImageFor(packageId: string, value: unknown): PackageImage | undefined;
export declare function uploadPackageImage(packageId: string, encoded: unknown): Promise<PackageImage>;
export declare function verifyPackageImage(image: PackageImage): Promise<void>;
export declare function readPackageImage(image: PackageImage): Promise<Buffer>;
export declare function retirePackageImage(image: PackageImage): Promise<void>;
export declare function publicPackageImageUrl(packageId: string, image: PackageImage): string;
//# sourceMappingURL=packageImages.d.ts.map