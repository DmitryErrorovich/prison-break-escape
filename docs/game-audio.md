# Recording gameplay with sound

This branch adds **original synthesized audio** using the browser Web Audio API;
no downloaded sound packs, music rights, third-party dependencies, or audio files.

- Start Escape: rising alert
- Running: alternating footsteps, intermittent low-volume siren
- Cash Out: short four-note success chime
- Crash: descending catch impact

**On a phone**, tap **SOUND OFF** once to switch it to **SOUND ON**.
iOS Safari and Android Chrome often block audio until this first tap.
Enable the sound before starting the auto-record sequence. Muting immediately
silences the mixer, and the next round remains silent until re-enabled.

Run the game on the same Wi-Fi as your computer:
```bash
npm run dev -- --host 0.0.0.0
```
Open the Network URL on your phone. Use the phone's built-in screen
recorder; make a five-second test and verify system audio is actually present
in the saved file because browser and OS capture policies vary.

Implementation: `src/game/GameAudio.ts` follows phase changes from
`DemoCrashEngine.subscribe()`, not React renders. Its AudioContext is lazy,
created only on user opt-in and closed when the app unmounts. Voice sounds
are short-lived native oscillators with gain envelopes; the optional loop
is driven by engine state updates, not timers or extra animation frames.

This is simulated, virtual-balance gameplay only.
