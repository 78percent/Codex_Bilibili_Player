## Purpose

Define a focused Bilibili video search experience that separates discovery, autocomplete and results, preserves only recent search terms, and returns selected videos to the current conversation through its shared playback session.

## ADDED Requirements

### Requirement: Search content follows input state
The interface SHALL display hot keywords and recent searches only when the trimmed input is empty. Nonempty input before submission SHALL display only autocomplete suggestions. Submitted searches SHALL display video results.

#### Scenario: Enter a keyword
- **WHEN** the user types or edits a nonempty keyword
- **THEN** a single full-width suggestion list is displayed without hot keywords, recent searches or their reserved columns

#### Scenario: Clear the input
- **WHEN** the user clears the input or leaves only whitespace
- **THEN** hot keywords and recent searches are displayed again

#### Scenario: Submit a search
- **WHEN** the user presses Enter, activates search, or selects a suggestion, hot keyword or recent search
- **THEN** the keyword is submitted and video results replace discovery and autocomplete content

### Requirement: Focus remains visible without a heavy input rectangle
The search interface SHALL use a subtle search-bar focus treatment instead of a heavy rectangle around the text input. Keyboard focus SHALL remain distinguishable without changing layout geometry.

#### Scenario: Focus and type
- **WHEN** the user focuses the text input
- **THEN** the search bar gains a light focus emphasis and no heavy text-field outline appears

#### Scenario: Navigate by keyboard
- **WHEN** keyboard navigation reaches the input or an action button
- **THEN** its focus is visibly identifiable, with the input indicated at the search-bar level

### Requirement: Recent searches preserve terms only
The system SHALL persist only submitted search terms, deduplicated and ordered by most recent use. It SHALL display at most ten terms within at most three rows. It SHALL NOT persist result lists, result pages, selected videos or result scroll positions.

#### Scenario: Repeat a previous keyword
- **WHEN** the user submits a term already in recent searches
- **THEN** that term moves to the front without creating a duplicate

#### Scenario: Use a recent search
- **WHEN** the user selects a recent-search term
- **THEN** the term is submitted directly as a new search, rather than restoring a stored result snapshot

#### Scenario: Restart
- **WHEN** the application is restarted
- **THEN** recent terms are restored and no previous result page is restored from persistent storage

#### Scenario: Narrow history area
- **WHEN** ten terms would occupy more than three rows
- **THEN** only the most recent terms fitting in three rows are initially visible and overflow terms cannot receive hidden keyboard focus

### Requirement: Results select the shared conversation player
The desktop result view SHALL display four video cards per row with cover, title, duration and author. Selecting a video SHALL use the current conversation's shared playback session and initiate playback under existing account eligibility rules.

#### Scenario: Select a video
- **WHEN** an eligible user selects a result video
- **THEN** search closes and the selected video appears in the current conversation player without creating a second playback session

### Requirement: Preview approval precedes local integration
The revised design SHALL remain an independent preview until the user confirms it. Preview completion SHALL NOT be reported as production integration or runtime verification.

#### Scenario: Revise the design
- **WHEN** the user requests preview refinements before approval
- **THEN** only the preview and planning records are updated and local product integration stays pending
