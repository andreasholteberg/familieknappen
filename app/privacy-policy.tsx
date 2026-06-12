import React from 'react';

import { LegalDocument } from '@/components/LegalDocument';
import { LEGAL_VERSIONS, PRIVACY_SECTIONS, PRIVACY_TITLE } from '@/content/legal';

export default function PrivacyPolicy() {
  return (
    <LegalDocument title={PRIVACY_TITLE} version={LEGAL_VERSIONS.privacy} sections={PRIVACY_SECTIONS} />
  );
}
