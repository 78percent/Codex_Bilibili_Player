## ADDED Requirements

### Requirement: Present coherent development scenarios
The application SHALL provide fictional projects with mutually consistent conversations, tool calls, code changes, terminal output and task states.

#### Scenario: Send a message
- **WHEN** the user submits a message
- **THEN** the selected preset progresses through observable stages and streams its response

#### Scenario: Resolve an approval step
- **WHEN** the user approves or refuses a simulated action
- **THEN** the scenario follows the corresponding local branch without executing a system command

### Requirement: Persist user actions
The application SHALL persist relevant local operations and offer continuation for interrupted scenarios.

#### Scenario: Reload during a scenario
- **WHEN** the application is reopened
- **THEN** previous records are restored and continuing does not duplicate completed steps

### Requirement: Keep simulations independent of real services
The application SHALL use fictional identities and data and SHALL NOT execute simulated AI, Git, cloud, payment or account actions against real services.

#### Scenario: Display execution output
- **WHEN** a scenario presents command output or a PR result
- **THEN** it comes from the local scenario and is never reported as an actual operation performed during this development task
