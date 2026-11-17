import { useEffect, useRef, useState } from 'react';
import { adminPackageCommands } from '../data/packageCommands';
import type { AdminPackage } from '../types/packages';

export function PackageImageField({ current, file, onChange, disabled }: {
  current?: AdminPackage;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pendingUrl, setPendingUrl] = useState('');
  const [savedUrl, setSavedUrl] = useState('');
  const [error, setError] = useState('');
  const [brokenUrl, setBrokenUrl] = useState('');

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPendingUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const packageId = current?.packageId;
  const imageId = current?.imageId;
  useEffect(() => {
    if (!packageId || !imageId) return;
    let live = true;
    void adminPackageCommands.loadImage(packageId).then(url => {
      if (live) setSavedUrl(url);
    }, () => {
      if (live) setError('The saved image preview is unavailable. You can select a replacement.');
    });
    return () => { live = false; };
  }, [packageId, imageId]);

  const url = file ? pendingUrl : savedUrl;
  return <fieldset disabled={disabled} style={{ minWidth: 0 }}>
    <legend>Primary package image</legend>
    {url && brokenUrl !== url && <img src={url} alt={file ? 'Selected package image preview' : 'Current package image'}
      onError={() => setBrokenUrl(url)} style={{ display: 'block', width: '100%', maxHeight: 180, objectFit: 'contain' }} />}
    {url && brokenUrl === url && <p role="status">Image preview unavailable.</p>}
    {imageId && !file && !url && !error && <p role="status">Loading current image…</p>}
    <label htmlFor="package-image">{imageId ? 'Replace image' : 'Select image'}</label>
    <input ref={input} id="package-image" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
      aria-describedby="package-image-help" onChange={event => {
        const selected = event.currentTarget.files?.[0];
        if (!selected) return;
        if (!selected.size || selected.size > 5 * 1024 * 1024) {
          event.currentTarget.value = '';
          onChange(null);
          setError('Choose a non-empty image up to 5 MB.');
          return;
        }
        setError('');
        onChange(selected);
      }} />
    <p id="package-image-help">JPEG, PNG or WebP, up to 5 MB. The image uploads when you save.</p>
    {file && <button type="button" className="button button--secondary" onClick={() => {
      if (input.current) input.current.value = '';
      onChange(null);
    }}>Clear selection</button>}
    {error && <p className="workflow-dialog__error" role="alert">{error}</p>}
  </fieldset>;
}
