## ADDED Requirements

### Requirement: Reproduce the selected desktop frontend
The application SHALL reproduce the locally installed Codex desktop interface using the approved page and state inventory, preserving its visual hierarchy and wording.

#### Scenario: Navigate the interface
- **WHEN** the user chooses a sidebar entry, settings section, menu action or workspace tab
- **THEN** the corresponding page or state is rendered with its own local interaction model

### Requirement: Preserve an empty video extension
The application SHALL keep the video integration module empty in this phase.

#### Scenario: Open the first delivery
- **WHEN** the user opens the application
- **THEN** no invented player or video metadata design is shown

### Requirement: Separate responsibilities
The implementation SHALL separate window integration, shared UI, feature modules, styles, scenario data and state management.

#### Scenario: Extend a feature
- **WHEN** a feature gains an interaction
- **THEN** its state and presentation belong to the feature or shared responsible layer, without embedding scenario transcripts in layout components
