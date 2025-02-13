# Protected Sections Documentation

## Overview
This document outlines the sections of the application that are locked and should not be modified without explicit approval. These sections are currently working as intended and any changes could impact critical functionality.

## Protected Components

### 1. Encounter Section
- **Main Component**: `src/components/Encounter.tsx`
- **Child Components**:
  - `src/components/EncounterListen.tsx`
  - `src/components/AudioPlayer.tsx`
  - `src/components/EncounterButtons.tsx`
  - `src/components/EncounterSpeak.tsx`
- **Key Functionality**:
  - Speech-to-text translation
  - Pre-recorded audio responses
  - Real-time audio processing
  - Bilingual support (English/Spanish)

### 2. Rights Section
- **Main Component**: `src/components/Rights.tsx`
- **Key Functionality**:
  - Constitutional rights information
  - Immigration rights guidance
  - Bilingual content
  - Case law references
  - Expandable sections

### 3. Proof/Registro Section
- **Main Component**: `src/components/Registro.tsx`
- **Key Functionality**:
  - Audio recording
  - Recording storage
  - Recording playback
  - Location tracking
  - Session management
  - Recording sharing

## Protected Database Migrations
All migrations in the `supabase/migrations/` directory are protected and should not be modified. These migrations establish the core database structure and functionality.

## Modification Protocol
1. **Required Approval**: Any changes to protected components must be explicitly approved.
2. **Impact Assessment**: Before proposing changes that might affect protected sections, conduct a thorough impact analysis.
3. **Testing Requirements**: Any approved changes must be thoroughly tested in isolation before integration.
4. **Documentation**: All approved changes must be documented with:
   - Reason for the change
   - Impact analysis
   - Testing results
   - Rollback plan

## Dependencies
The following dependencies are critical for these protected sections:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.7",
    "uuid": "^9.0.1"
  }
}
```

## Environment Variables
These protected sections rely on the following environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ELEVENLABS_API_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`

## Critical Notes
1. The audio processing and recording features are finely tuned - any changes could affect reliability
2. The rights information is legally verified - content changes require legal review
3. The database schema supports critical features - structural changes need careful consideration
4. The translation system is integrated throughout - language-related changes need comprehensive testing