# Package images and publication

The Admin package form sends the selected original with the package fields through the Gen 2 `savePackage` callable. It shows selected and current image previews, progress while the save is pending, and validation feedback. Clearing a pending selection keeps the current image. Mock Admin uploads are in memory. The public mock catalogue uses the existing fixture image in explicit development mock mode.

## Storage and validation

The callable checks the trusted `role === 'admin'` claim, stable package code and target package before processing image bytes. It accepts base64 in transit with a decoded limit of 5 MiB. Sharp decodes still JPEG, PNG and WebP input within 20 megapixels, applies orientation, and re-encodes to WebP inside 1200 × 900 without distortion or upscaling. Output is capped at 1 MiB.

Each upload creates `package-images/{packageId}/{uuid}.webp` with an object-create precondition. Firestore stores the image ID, path and generation. The client cannot supply an object reference or external URL to attach. Firebase Storage rules deny direct client reads, lists and writes. Keep the bucket private in Cloud IAM and keep Firebase download tokens off package image objects.

The public HTTP handler checks that the requested image is the current image of a published package, reads that exact generation and serves WebP with `Cache-Control: no-store`. A separate claim-checked callable supplies the Admin preview for drafts. Live catalogue responses expose only the public delivery URL and existing allowlisted catalogue fields.

## Publication and migration

An inactive package can have no image. Publishing requires valid package fields, positive integer ZAR cents and an image validated by the upload flow. When publishing with the current image, the callable checks its Storage generation exists. Legacy active packages without a valid image reference are omitted from both live catalogues. The operation-creation callable checks publication eligibility and still reads the authoritative Firestore price. Existing operations keep their snapshots.

Plan a rollout window for existing active packages. They become unavailable for new requests until an Admin uploads an image and saves them with a positive price. Upload a distinct image for each package. The server isolates images by package and does not compare content for duplicate uploads.

## Replacement and cleanup

The replacement object is saved before the Firestore transaction. After the transaction commits, the callable retires the previous exact generation. A failed upload leaves the current reference intact. Definitive application validation failures attempt to remove unattached uploads. Ambiguous infrastructure failures retain the new object pending reconciliation.

For cleanup, compare older objects under the package-specific prefix to the path and generation on the package document. Delete only confirmed unreferenced generations after accounting for in-flight requests. An age-based cleanup rule on the whole prefix would also remove current images. Soft-delete and versioning can retain retired generations and incur storage charges.

## Deployment and costs

Provision Firebase Cloud Storage and give the Functions runtime service account permissions to create, read and delete package objects. The code uses the Firebase Admin default bucket, or the approved bucket name supplied as `PACKAGE_IMAGES_BUCKET` in the Functions project environment. Deploy the rules to the same bucket. Review any existing bucket rules before replacing them with this repository's deny-all direct-client rules. Public invocation must be enabled for the image handler.

Run from the repository root. The first command installs the pinned decoder and updates the npm lockfile. Include the generated root lockfile update before running CI with `npm ci`.

```powershell
npm install
npm run typecheck
npm run lint
npm run build
```

After selecting a rollout window and building the frontends with production Vite values:

```powershell
firebase deploy --only storage --project secret-service-37f6b
firebase deploy --only "functions:savePackage,functions:getAdminPackageImage,functions:getPublicPackageImage,functions:getPublicCatalog,functions:getCustomerCatalog,functions:createOperation" --project secret-service-37f6b
firebase deploy --only "hosting:admin,hosting:customer,hosting:web" --project secret-service-37f6b
```

Each public image request incurs a Function invocation, Firestore read, Storage read and egress. Lazy loading, output size and instance caps bound work. With no caching, unpublishing takes effect on subsequent requests. Bytes already downloaded cannot be recalled. SDK uploads report indeterminate progress, without a per-byte percentage.

## Manual test checklist

- Save an inactive image-less draft. Attempt publication with no image and with zero price. Confirm server rejection.
- Publish JPEG, PNG and WebP. Try corrupt files, renamed SVGs, oversized originals and animated files. Confirm proportions are preserved.
- Exercise preview, clear, upload and replace on desktop and mobile. Confirm duplicate submits are blocked while saving and failed saves keep the previous image.
- Attempt uploads and draft previews signed out and as Customer or Ambassador. Attempt direct Storage reads, lists and writes. Confirm denial and check bucket IAM separately.
- Check published, draft, stale and cross-package URLs. Confirm broken-image states are usable on Home, Dossiers and the dialog.
- Check Customer selection and stale package links. Confirm operation prices come from Firestore and historical snapshots are unchanged.
- Try two overlapping replacements and an interrupted save. Check the committed image and reconcile abandoned objects.
- Exercise mock mode without Storage access and confirm production never substitutes fixture images.

Static Storage assessment:

```json
{
  "score": 4,
  "summary": "Direct Storage access is denied. Trusted Functions enforce Admin uploads and current publication checks.",
  "findings": [
    {
      "check": "Resource exhaustion",
      "severity": "minor",
      "issue": "Published image URLs can be requested repeatedly by anonymous callers.",
      "description": "Size and instance caps bound work. Review traffic, egress, and billing alerts in production."
    }
  ]
}
```
