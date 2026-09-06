import type { AdminAmbassador } from '../types/fulfilment';

// Match the trusted assignment commands: stored identity wins over the display name.
export const eligibleAmbassadors = (
  ambassadors: readonly AdminAmbassador[],
  operation: { campus: string; campusCode?: string },
): readonly AdminAmbassador[] => {
  const campusCode = operation.campusCode ?? operation.campus.trim().toLocaleLowerCase('en-ZA').replace(/\s+/g, '-');
  return ambassadors.filter(item => item.active && item.availability === 'AVAILABLE'
    && (item.campusCodes.length === 0 || item.campusCodes.includes(campusCode)));
};
