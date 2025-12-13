# VocabChain - English Centered Turkish Vocabulary Learning Platform

## Overview
VocabChain is a vocabulary learning application that allows users to learn words from multiple languages. The application supports dynamic language creation by admins and tracks user progress across different languages.

## Core Features

### Language Management
- Support for unlimited dynamic languages with properties: name, language code, flag emoji, text direction (LTR/RTL), gradient colors, ordering field (integer rank), and creation timestamp
- Pre-seeded with 7 languages: English, Turkish, Spanish, Arabic, German, Japanese, and French
- English is included as a selectable language with its own vocabulary set across four difficulty levels
- Admin-only language creation with instant UI reflection
- Each language includes sample vocabulary words loaded from external JSON files
- Languages are always sorted by ordering field (ascending) across all frontend displays
- Admin can edit language ordering with immediate persistence and UI updates

### Full Language Lifecycle Management
- Admin can add new languages with complete metadata (name, code, flag emoji, text direction, gradient colors, ordering)
- Admin can remove entire languages including all associated words with confirmation dialog
- Language removal includes language-scoped word deletion and immediate cache invalidation
- Admin can import words for any language via JSON using existing optimized import flow
- All language operations reflect immediately across Admin Panel, Home Page, and Language Page
- Language ordering persisted in stable storage and enforced across all frontend queries

### Vocabulary System
- Words stored with English translation, foreign language text, difficulty level (Beginner/Medium/Hard/Advanced), up to 5 example sentences per word, and timestamps
- Words are associated with specific languages
- Vocabulary data loaded from external JSON files during deployment or admin-triggered seeding
- JSON files contain structured vocabulary data with proper validation
- For English language entries, both english and foreign fields contain the same English word
- Words are searchable and filterable by difficulty level
- Backend optimized for scalable storage and query patterns supporting 10,000+ words with indexing by language and difficulty

### JSON Vocabulary Import System
- Frontend performs complete JSON parsing and validation before sending to backend
- Backend provides `bulkImportWords` function that accepts arrays of Word records in batches (200-500 words per call)
- Words are persisted to stable map storage in efficient batch operations
- Each word is added only once per language, with updates overwriting existing entries by English word
- Admin panel processes large vocabulary files by splitting into batches and sending multiple backend calls
- Single progress indicator shows overall import completion without per-item UI re-renders
- Import confirmation displays count of words successfully imported with timing information
- Graceful error handling for malformed JSON or import failures
- Success toasts display format: "✅ Imported 150 words in 1.2s"

### Language-Scoped Word Management
- Backend provides `removeWordsByLanguage` function that accepts a language name parameter
- Function safely iterates through stored words, collecting IDs of words matching the specified language name
- Uses two-pass deletion: first collect word IDs to delete, then remove them in a second pass to avoid mutation-while-iterating errors
- Includes proper existence checks to prevent exceptions when no words match the filter
- Backend provides `removeAllWords` function for global word deletion (all languages)
- Admin panel "Remove All Words" action requires selecting a specific language from dropdown
- Language-scoped deletion shows confirmation dialog clearly stating which language will be wiped
- Success toast displays: "🗑️ All [Language Name] words removed successfully"
- After deletion, automatically refetches words for both admin panel and user-facing language tabs for instant UI updates

### User Progress Tracking
- Track user statistics: total correct answers, total questions answered, current streak, last played time
- Badge system for achievements
- Progress data persisted per user principal

### Admin Authentication System
- Username/password authentication for admin panel access
- Static credentials: username "admin" and password "1234"
- Login form with username and password fields
- Authentication state persists during session using local storage
- Friendly error message for invalid credentials: "Invalid username or password"
- Admin authentication is separate from regular user authentication flows
- Once authenticated, admin has full access to admin panel features

### Enhanced Admin Panel UI
- Persistent Info Panel at the top that clearly reflects current admin actions and context
- Info Panel displays: selected language, active difficulty filter, search query, bulk actions in progress
- Turkish auto-selected as default language with Beginner difficulty preselected on initial load
- Full language lifecycle management interface with add/remove/reorder capabilities
- Language ordering editor with drag-and-drop or input field controls
- Immediate UI updates when languages are added, removed, or reordered
- Protected admin actions using username/password authentication
- Login form required before accessing admin panel functionality
- Animated "Create New Language" form with fields for name, flag emoji, gradient colors, text direction, and ordering
- Full word management interface accessible via `/admin` route for adding, editing, and deleting words
- Admin panel displays all difficulty levels (Beginner, Medium, Hard, Advanced) with example sentences per word
- Word filtering and search capabilities by difficulty level in admin view
- JSON vocabulary import functionality with frontend parsing and backend batch processing
- Language-scoped "Remove Words" functionality with language selection dropdown and confirmation dialog
- Complete language removal with confirmation dialog and associated word deletion
- Immediate UI updates when new languages or words are added
- Admin panel and affected language tabs automatically refresh after import or delete operations complete

### Language Page
- Standalone Language Page accessible from the Home Page replacing language tabs
- Defaults to Turkish language on first load
- Search bar that matches both English and Turkish text
- Difficulty filters: Beginner, Medium, Hard, Advanced
- Renders full list of all matching words with no item cap
- Pagination or infinite scroll for large datasets
- Each word row displays: English text, Turkish text, difficulty level, and expandable button to view all 5 example sentences
- Back button to return to Home Page
- Mobile-first responsive design with smooth transitions

### Home Page Layout
- Compact language cards display (approximately 50% smaller than previous size)
- Each card shows: flag emoji, language name, and "Start Learning" button
- Support for many languages without visual clutter
- Turkish always appears first via ordering field
- Languages sorted by ordering field (ascending) for consistent display
- Responsive grid layout that adapts to different screen sizes
- Smooth transitions when languages are added or removed

### Game Modes
Six fully functional game modes embedded on the Language Page with complete bug fixes and stable implementations:

1. **Meaning Match**: English word → choose correct Turkish translation from multiple choice
   - Loads complete vocabulary dataset (not capped to 5 items)
   - Generates proper multiple-choice Turkish options with correct answer shuffling
   - Handles selection events correctly with immediate UI feedback
   - Updates score and streak state reliably
   - Auto-loads next question without state corruption
   - Prevents duplicate options and ensures valid answer sets

2. **Reverse Meaning**: Turkish word → choose correct English translation from multiple choice
   - Correctly loads Turkish words from full vocabulary dataset
   - Generates valid English option sets with proper shuffling
   - Validates answers accurately with immediate feedback
   - Updates UI state consistently between rounds
   - Smooth transitions with proper state management

3. **Gap-Fill Sentence**: Sentence with missing word → choose correct English word to complete
   - Safely selects example sentences with null/empty sentence protection
   - Generates proper blanks in sentences without breaking formatting
   - Constructs valid option sets from vocabulary pool
   - Evaluates answers correctly with context validation
   - Prevents crashes from missing or malformed sentence data

4. **Flashcards**: Flip cards showing English on front, Turkish translation and 5 example sentences on back
   - Ensures correct word loading from complete dataset
   - Stable flip animations without state corruption
   - Reliable swipe and next navigation controls
   - Full display of all 5 example sentences on card back
   - Proper card cycling and progress tracking

5. **Memory Match**: Match pairs of English and Turkish words in grid layout
   - Correct grid generation with proper card pair creation
   - Shuffled card pairs with unique identifiers
   - Robust flip and match logic with state consistency
   - Proper mismatch reset timing without race conditions
   - Accurate completion detection and scoring
   - Complete replay reset functionality

6. **Speed Challenge**: 30-second rapid-fire mode with mixed question types
   - Robust countdown timer with accurate timing
   - Fast question pipeline without loading delays
   - Streak-based scoring system with proper multipliers
   - Debounced answer handling to prevent double-submissions
   - Comprehensive final summary screen with statistics
   - Mixed question types from all game modes

All game modes include:
- Complete vocabulary dataset loading (no artificial caps)
- Proper scoring systems with streak tracking
- Smooth animations and transitions
- Sound effect integration points
- Mobile and desktop compatibility
- Consistent state management
- Error boundary protection
- Loading state handling

### Shared Game Utilities
- Standardized question generator functions across all modes
- Centralized option shuffling algorithms
- Unified scoring and streak logic
- Shared vocabulary filtering and selection utilities
- Common UI components for consistent game experience
- Reusable hooks for game state management

### User Interface
- Modern, mobile-first design with bright gradients and soft shadows
- Playful transitions and animations throughout the interface
- Support for both LTR and RTL text directions
- Responsive design optimized for mobile devices
- Language Page includes word filtering and search by difficulty level
- Turkish displayed as first option in all language selectors
- Visual loading states during data fetching
- Progress indicators for game modes and vocabulary operations
- Success/error toast notifications with timing and count information
- Empty state fallback text displays "No words yet, try refreshing or adding new ones!" when language data is temporarily empty
- Fixed React state management with proper dependency arrays
- Corrected event listeners and key assignments
- Stable component rendering without unnecessary re-renders

### Profile Setup Optimization
- ProfileSetupModal implements optimistic UI updates for immediate user feedback
- Profile save operations use asynchronous background processing to prevent UI blocking
- Instant "saved" animations and smooth transitions to main screen without waiting for backend response
- Toast notifications confirm save success or failure with timeout fallback
- React Query mutations configured for immediate cache updates and non-blocking user experience

### Error Handling and Resilience
- Robust error handling across all frontend queries to prevent application crashes
- Loading states displayed for all data fetching operations with friendly "Loading…" spinners
- Graceful fallbacks when backend requests fail or return null data
- Main application always loads and remains functional even when backend is unavailable
- All components handle missing or null data by showing appropriate placeholders
- Error messages displayed to users when data cannot be loaded
- Frontend queries implement proper error boundaries to prevent render tree crashes
- JSON import error handling with detailed error messages for malformed vocabulary files
- Game mode error boundaries to prevent single game crashes from affecting entire application
- Safe null access patterns throughout all components
- Proper React hooks dependency management

## Backend Data Storage
The backend stores three main data types in stable maps:
- **Languages**: Language information including visual styling, metadata, and ordering field, with Turkish as the first language in all listings
- **Words**: Vocabulary entries with translations, example sentences, and difficulty ratings (Beginner/Medium/Hard/Advanced), optimized for 10,000+ word storage with indexing
- **User Progress**: Individual user statistics and achievements
- **Admin Credentials**: Static admin authentication credentials for admin panel access

Turkish is prioritized as the first language with the following properties:
- name: "Turkish"
- code: "tr" 
- flagEmoji: "🇹🇷"
- textDirection: LTR
- gradientStart: "#dc2626"
- gradientEnd: "#ea580c"
- ordering: 1

### Language Lifecycle Backend Functions
- `addLanguage` function accepts language metadata including ordering field
- `removeLanguage` function removes language and all associated words with confirmation
- `updateLanguageOrdering` function updates ordering field for language reordering
- `getLanguagesSorted` function returns languages sorted by ordering field (ascending)
- All language operations trigger immediate cache invalidation across frontend

### Batch Operations Backend Functions
- `bulkImportWords` function accepts arrays of Word records for efficient batch insertion
- Processes words in batches of 200-500 records per call within single update operations
- Persists words to stable map storage with deduplication by English word per language
- Returns import success status and count of words processed with timing information
- `removeWordsByLanguage` function accepts language name parameter for safe language-scoped deletion
- Uses two-pass deletion algorithm: collect matching word IDs first, then delete in second pass
- Includes proper existence checks and error handling to prevent exceptions
- `removeAllWords` function accepts optional language parameter for targeted or global word deletion
- Returns deletion success status and count of words removed
- Backend ensures languages are returned sorted by ordering field in all query results

### Backend Error Handling
- All backend API endpoints return default empty arrays (`[]`) instead of null when no data exists
- Consistent error handling across all backend functions to maintain frontend stability
- Proper error responses that frontend can handle gracefully
- JSON import parsing errors are caught and reported with specific error messages
- Batch operations return success/failure status with progress and timing information
- Word deletion functions include proper existence checks to avoid traps and exceptions
- Language operations include validation and error handling for ordering conflicts

## Technical Architecture
- Folder structure prepared for scalability with separate admin and game components
- Placeholders included for future sound, animation, and haptic feedback features
- Schema designed for unlimited language expansion with on-chain storage
- Admin route `/admin` provides full word management capabilities with username/password authentication
- Comprehensive error handling and loading state management throughout the application
- Admin authentication state managed separately from user authentication flows
- Backend batch processing system with efficient bulk operations for vocabulary management
- Frontend query invalidation system ensures admin panel and affected language tabs update after vocabulary operations
- Optimized import performance with frontend JSON parsing and backend batch processing
- Language-scoped deletion system with safe iteration and proper error handling
- Two-step confirmation system for destructive admin operations with clear language specification
- Scalable backend architecture supporting 10,000+ words with proper indexing and query optimization
- Default routing to Turkish language on application first load
- Consistent data flow from canister through React Query to UI components
- Standardized component architecture with proper separation of concerns
- Centralized game logic with reusable utilities and hooks
- Mobile-first responsive design with cross-platform compatibility
- Language ordering system with persistent storage and consistent frontend sorting
- Full language lifecycle management with immediate UI reflection across all components
