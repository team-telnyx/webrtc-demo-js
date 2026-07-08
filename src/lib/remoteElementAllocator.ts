/**
 * Allocates a fresh per-call remoteElement id for the SDK-managed remote audio.
 *
 * Each call (outbound `newCall` and inbound `answer`) gets its own incremented
 * id (`shared_1`, `shared_2`, …) so concurrent calls attach their remote streams
 * to independent `<audio>` elements instead of fighting over one shared element
 * (last-writer-wins conflict). The id is passed to the SDK as `remoteElement`
 * (PR #725 / VSUP-121: `AnswerParams.remoteElement` + `newCall` `remoteElement`)
 * and rendered by `PerCallRemoteAudio`. The SDK resolves the string id to the
 * `<audio>` element via `document.getElementById` at attach time.
 *
 * The counter is module-level and never resets — ids only need to be unique
 * within a page session, not sequential after cleanup.
 */
let counter = 0;

export const allocateRemoteElementId = (): string => {
  counter += 1;
  return `shared_${counter}`;
};
