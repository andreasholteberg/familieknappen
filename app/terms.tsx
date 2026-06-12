import React from 'react';

import { LegalDocument } from '@/components/LegalDocument';
import { LEGAL_VERSIONS, TERMS_SECTIONS, TERMS_TITLE } from '@/content/legal';

export default function Terms() {
  return <LegalDocument title={TERMS_TITLE} version={LEGAL_VERSIONS.terms} sections={TERMS_SECTIONS} />;
}
