# Local Defender scan execution - 2026-10-02

- Workcell: `LOCAL-HOST-OPERATIONS-2026-10-02`, supplemental execution record.
- Actor and recorded by: Codex.
- Objective and plan: run the free built-in Defender quick scan after the last
  recorded quick scan was two days old, then read back start/end timestamps and
  bounded detection/action events. No Defender setting was changed.
- Source basis: signed local commit
  `566cabe2a27baf2d68f45e445221b4d48bbf36c5`.
- Command: `Start-MpScan -ScanType QuickScan -ErrorAction Stop` followed by
  `Get-MpComputerStatus` and a retained Operational event-count query.
- Requested: `2026-10-03T01:25:04.9750305Z` (October 2, New York).
- Start read-back: `2026-10-03T01:25:10.084Z`.
- End read-back: `2026-10-03T01:27:28.284Z`.
- Command exit: 0; `QuickScanAge=0`, real-time protection still enabled.
- Recorded at: `2026-10-03T01:27:28Z`.
- Detection/action evidence: the bounded retained-event query for event types
  1116, 1117, 1118 and 1119 since scan start returned zero matching records.
  This is a retained-log observation, not a threat-free-host claim.
- Receipt: latest JSON under the user's local maintenance state directory;
  no event message, path, account, address, or process identity is retained.
- Proof level: 2, local scan execution and read-back. No UI or route changed.
- Security and claims: no credentials or private host identifiers were added.
  Tamper Protection, off-device backup, business-lane live inputs, and hosted
  release gates retain the limits recorded in
  [the local operations proof](LOCAL_HOST_OPERATIONS_PROOF_20261002.md).

The command is documented by
[Microsoft Start-MpScan](https://learn.microsoft.com/en-us/powershell/module/defender/start-mpscan?view=windowsserver2025-ps).

## Final execution read-back

- At `2026-10-03T01:36:27Z`, `run-local-evolution.ps1` verified local source
  against signed HEAD `01dfa003be85284c8d89da0b0ba55ce9060b0e33` and returned
  `PARTIAL`, exit 2. All six lanes retained `DEMO`, live `UNAVAILABLE`, and
  actions `BLOCKED`; runtime readiness remained `UNKNOWN`.
- Direct Defender read-back confirmed antivirus and real-time protection on,
  the completed quick-scan timestamps above, and Tamper Protection off.
- The user's instruction to handle the remaining Windows Security switch was
  followed with an attempt to initialize the supported Windows control runtime.
  That call and a minimal runtime check both failed with `Transport closed`.
  No Windows Security UI input or setting change occurred.
- A read-only volume inventory found only C: as a mounted drive letter; no
  separate backup destination was available. Off-device recovery stays unknown.
- C: free bytes at the last read-back were `1694154752`; free space remains
  volatile. No dependency install, model download, or application build ran.
- This is a supplemental observation record; source logic and UI are unchanged.
